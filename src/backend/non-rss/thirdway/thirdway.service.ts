import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import * as numeral from 'numeral';
import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import { TWMainRaw } from './shared';
import { CreateLog } from '../../log/shared/dto/create-logo.dto';
import { LogTypeEnum } from '../../log/shared';
import {
  CreateStreamEntries,
  StreamEntryOriginHealthEnum,
  StreamOriginEnum,
} from '../../stream-entry/shared';
import { PublicationService } from '../../publication/publication.service';
import { NonRssOriginEnum } from '../shared';
import { StreamEntryOriginService } from '../../stream-entry/stream-entry-origin.service';

@Injectable()
export class ThirdwayService {
  private readonly logger = new Logger(ThirdwayService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
    private publicationService: PublicationService,
  ) {}

  async getMain() {
    let data: TWMainRaw;
    let errorLast = null;
    let totalArticles = 0;
    let created = 0;
    let updated = 0;
    const maxTotal = 2;

    this.logger.log('third started ....');

    try {
      let page = 1;
      let total = page;
      let countFailed = 0;
      const maxFailed = 5;

      while (page <= Math.min(total, maxTotal)) {
        const start = numeral(moment().format('x')).value();
        const response = <any>await this.fetchMain(page);

        this.logger.log(
          numeral(moment().format('x')).value() - start,
          'page: ',
          page,
        );

        data = response.data;
        console.log(data, '=>=>=>=>=>=>=>=>');
        const pages = data.pages || [];
        total =
          pages.length > 0
            ? numeral(
                pages.reduce(
                  (_p, _c) =>
                    `${Math.max(
                      numeral(_p).value(),
                      numeral(_c).value() || 0,
                    )}`,
                ),
              ).value() || 9999
            : 9999;

        if (data.articles.length < 1 && countFailed++ < maxFailed) {
          continue;
        }

        const opt = {
          error: null,
          countCreated: 0,
          countUpdated: 0,
          totals: 0,
        };
        await this.getSubs(data, opt);

        totalArticles += opt.totals;
        created += opt.countCreated;
        updated += opt.countUpdated;

        if (opt.error) {
          errorLast = opt.error.response?.data || opt.error;
          // break;
        }
        break;

        countFailed = 0;
        page++;
      }
    } catch (error) {
      errorLast = error.response?.data || error;
      this.logger.log(error);
    }

    this.logger.log('thirdway ended ....');

    const health =
      totalArticles < 1
        ? StreamEntryOriginHealthEnum.OFFLINE
        : errorLast
        ? StreamEntryOriginHealthEnum.DEGRADED
        : StreamEntryOriginHealthEnum.ACTIVE;

    const note = JSON.stringify({
      total: totalArticles,
      created,
      updated,
      error: errorLast,
    });
    await this.streamEntryOriginService.updateHealthStatus(
      StreamOriginEnum.NON_RSS_THIRDWAY,
      health,
      note,
    );

    if (created < 1 && updated < 1 && !errorLast) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.NON_RSS_TW,
        JSON.stringify({ created, updated, errorLast }),
      ),
    );
    this.logService.save(logItem);
  }

  async fetchMain(page: number) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('SCRAPINGBEE_HOST');
      const url = this.configService.get<string>('SCRAPINGBEE_URL');
      const token = this.configService.get<string>('SCRAPINGBEE_TOKEN');
      const twHost = this.configService.get<string>('THIRDWAY_HOST');
      const twMain = this.configService.get<string>('THIRDWAY_MAIN');

      // console.log(
      //   JSON.stringify({
      //     articles: {
      //       selector: '.PaginatedEntry.row',
      //       type: 'list',
      //       output: {
      //         title: 'h2 a',
      //         canonical: {
      //           selector: 'h2 a',
      //           output: '@href',
      //         },
      //         publication: '.publication-name',
      //       },
      //     },
      //     pages: {
      //       selector: '.Pagination ul li span',
      //       type: 'list',
      //     },
      //   }),
      // );

      const params = {
        url: `https://${twHost}/${twMain}?page=${page}`,
        api_key: token,
        wait_for: '.PaginatedEntry.row',
        extract_rules: JSON.stringify({
          articles: {
            selector: '.PaginatedEntry.row',
            type: 'list',
            output: {
              title: 'h2 a',
              canonical: {
                selector: 'h2 a',
                output: '@href',
              },
              publication: '.publication-name',
            },
          },
          pages: {
            selector: '.Pagination ul li span',
            type: 'list',
          },
        }),
      };

      this.httpService
        .get(`https://${host}/${url}`, {
          params,
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  async getSubs(data: TWMainRaw, optIn: any) {
    optIn.totals = data.articles?.length || 0;
    optIn.countCreated = 0;
    optIn.countUpdated = 0;

    for (let i = 0; i < data.articles?.length; i++) {
      const { canonical, title, publication } = data.articles[i];
      if (!canonical) {
        optIn.error = 'canonical url is empty';
        continue;
      }
      const opt = { error: null };
      const rawData = await this.publicationService.getSub(
        publication,
        canonical,
        opt,
      );
      // console.log(rawData, '++++++++++++++++++++++');
      if (opt.error) {
        optIn.error = opt.error;
        continue;
      }
      if (!rawData) {
        continue;
      }

      const { author, content, published } = rawData;
      const entryId = crypto
        .createHash('sha256')
        .update(canonical)
        .digest('base64');

      const preItem = await this.streamEntryService.findOneByEntryId(entryId);

      if (!published) {
        optIn.error = 'published is empty';
        continue;
      }

      if (
        preItem &&
        moment(published).format('x') === moment(preItem.published).format('x')
      ) {
        continue;
      }

      const createStreamEntries = CreateStreamEntries.publicationRawFactory({
        entryId,
        canonical: rawData.canonical ? rawData.canonical : canonical,
        canonicalOrigin: canonical,
        title,
        author,
        content,
        published,
        publication: rawData.publication,
        nonRssOrigin: NonRssOriginEnum.THIRDWAY,
      });

      let createdStreamEntry =
        this.streamEntryService.create(createStreamEntries);
      if (preItem) {
        createdStreamEntry.id = preItem.id;
        optIn.countUpdated++;
      } else {
        optIn.countCreated++;
      }

      createdStreamEntry = await this.streamEntryService.save(
        createdStreamEntry,
      );

      const streamEntry = await this.streamEntryService.findOneById(
        createdStreamEntry.id,
      );

      const amznMentioned =
        this.streamEntryService.isAmznMentioned(streamEntry);
      if (createdStreamEntry.amznMentioned !== amznMentioned) {
        createdStreamEntry.amznMentioned = amznMentioned;
        await this.streamEntryService.save(createdStreamEntry);
      }

      break;
    }
  }
}
