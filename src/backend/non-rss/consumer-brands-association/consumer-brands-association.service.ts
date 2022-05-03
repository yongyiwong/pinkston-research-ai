import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import { CBAMainRaw, CBASubRaw } from './shared';
import * as numeral from 'numeral';
import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import {
  CreateStreamEntries,
  StreamEntryOriginHealthEnum,
  StreamOriginEnum,
} from '../../stream-entry/shared';
import { LogTypeEnum } from '../../log/shared';
import { CreateLog } from '../../log/shared/dto/create-logo.dto';
import { StreamEntryOriginService } from '../../stream-entry/stream-entry-origin.service';

@Injectable()
export class ConsumerBrandsAssociationService {
  private readonly logger = new Logger(ConsumerBrandsAssociationService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
  ) {}

  async getMain() {
    let data: CBAMainRaw;
    let errorLast = null;
    let created = 0;
    let updated = 0;
    let totalArticles = 0;
    const maxTotal = 2;

    this.logger.log('consumer-brands-association started ....');

    try {
      let page = 1;
      let total = page;

      while (page <= Math.min(total, maxTotal)) {
        const start = numeral(moment().format('x')).value();
        const response = <any>await this.fetchMain(page);

        this.logger.log(
          numeral(moment().format('x')).value() - start,
          'page: ',
          page,
        );

        data = response.data;
        total = numeral(data.totalPages).value();

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

        page++;
      }
    } catch (error) {
      errorLast = error.response?.data || error;
      this.logger.log(error);
    }

    this.logger.log('consumer-brands-association ended ....');

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
      StreamOriginEnum.NON_RSS_CONSUMER_BRANDS_ASSOCIATION,
      health,
      note,
    );

    if (created < 1 && updated < 1 && !errorLast) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.NON_RSS_CBA,
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
      const consumerHost = this.configService.get<string>(
        'CONSUMER_BRANDS_ASSOCIATION_HOST',
      );
      const consumerMain = this.configService.get<string>(
        'CONSUMER_BRANDS_ASSOCIATION_MAIN',
      );
      const params = {
        url: `https://${consumerHost}/${consumerMain}?fwp_paged=${page}`,
        api_key: token,
        extract_rules: {
          articles: {
            selector: '.block-listing__item-link',
            type: 'list',
            output: {
              title: 'a',
              canonical: {
                selector: 'a',
                output: '@href',
              },
            },
          },
          totalPages: {
            selector: '.facetwp-page.last',
          },
        },
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

  async getSubs(data: CBAMainRaw, optIn: any) {
    optIn.totals = data.articles?.length || 0;
    optIn.countCreated = 0;
    optIn.countUpdated = 0;

    for (let i = 0; i < data.articles?.length; i++) {
      const { canonical, title } = data.articles[i];
      if (!canonical) {
        optIn.error = 'canonical url is empty';
        continue;
      }
      const opt = { error: null };
      const cbaSubRaw = await this.getSub(canonical, opt);
      if (opt.error) {
        optIn.error = opt.error;
        continue;
      }
      if (!cbaSubRaw) {
        continue;
      }

      const { author, content, published } = cbaSubRaw;
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
        moment(published, moment.ISO_8601).format('x') ===
          moment(preItem.published).format('x')
      ) {
        continue;
      }

      const createStreamEntries = CreateStreamEntries.cbaEntryRawFactory({
        entryId,
        canonical,
        title,
        author,
        content,
        published,
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
    }
  }

  async getSub(canonical: string, optIn: any): Promise<CBASubRaw> {
    const preItem = await this.streamEntryService.findOne({
      where: { canonicalUrl: canonical },
    });
    if (preItem) {
      return null;
    }

    try {
      const start = numeral(moment().format('x')).value();
      const response = <any>await this.fetchSub(canonical);

      this.logger.log(
        numeral(moment().format('x')).value() - start,
        'new fetched canonical: ',
        canonical,
      );

      return response.data;
    } catch (error) {
      optIn.error = error;
      this.logger.log(error);
      console.log(error);
      return null;
    }
  }

  async fetchSub(canonical: string) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('SCRAPINGBEE_HOST');
      const url = this.configService.get<string>('SCRAPINGBEE_URL');
      const token = this.configService.get<string>('SCRAPINGBEE_TOKEN');

      const params = {
        url: canonical,
        api_key: token,
        extract_rules: {
          content: {
            selector: '.basic-content__wysiwyg-content',
          },
          author: {
            selector: '.author-name a',
          },
          published: {
            selector: `meta[property="article:published_time"]`,
            output: '@content',
          },
        },
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
}
