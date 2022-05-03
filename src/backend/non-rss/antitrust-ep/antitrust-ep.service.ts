import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import { AntitrustEPMainRaw /*, AntitrustEPSubRaw*/ } from './shared';
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
export class AntitrustEPService {
  private readonly logger = new Logger(AntitrustEPService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
  ) {}

  async getMain() {
    let data: AntitrustEPMainRaw;
    let errorLast = null;
    let totalArticles = 0;
    let created = 0;
    let updated = 0;
    this.logger.log('antitrustEP started ....');

    try {
      const start = numeral(moment().format('x')).value();
      const response = <any>await this.fetchMain();

      this.logger.log(numeral(moment().format('x')).value() - start);

      data = response.data;

      const opt = { error: null, countCreated: 0, countUpdated: 0, totals: 0 };
      await this.getSubs(data, opt);

      totalArticles += opt.totals;
      created += opt.countCreated;
      updated += opt.countUpdated;

      if (opt.error) {
        errorLast = opt.error.response?.data || opt.error;
        // break;
      }
    } catch (error) {
      errorLast = error.response?.data || error;
      this.logger.log(error);
    }

    this.logger.log('antitrustEP ended ....');

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
      StreamOriginEnum.NON_RSS_ANTITRUST_EP,
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

  async fetchMain() {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('SCRAPINGBEE_HOST');
      const url = this.configService.get<string>('SCRAPINGBEE_URL');
      const token = this.configService.get<string>('SCRAPINGBEE_TOKEN');
      const antitrustEPHost =
        this.configService.get<string>('ANTITRUST_EP_HOST');
      const antitrustEPMain =
        this.configService.get<string>('ANTITRUST_EP_MAIN');
      const params = {
        url: `https://${antitrustEPHost}/${antitrustEPMain}`,
        api_key: token,
        render_js: false,
        extract_rules: {
          articles: {
            selector: '#wsite-content .blog-post',
            type: 'list',
            output: {
              title: {
                selector: '.blog-header .blog-title a',
              },
              canonical: {
                selector: '.blog-header .blog-title a',
                output: '@href',
              },
              published: {
                selector: '.blog-date .date-text',
              },
              content: {
                selector: '.blog-content .paragraph',
              },
            },
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

  async getSubs(data: AntitrustEPMainRaw, optIn: any) {
    optIn.totals = data.articles?.length || 0;
    optIn.countCreated = 0;
    optIn.countUpdated = 0;

    for (let i = 0; i < data.articles?.length; i++) {
      const {
        canonical: _canonical,
        title,
        published,
        content,
      } = data.articles[i];

      if (!_canonical) {
        optIn.error = 'canonical url is empty';
        continue;
      }

      const antitrustEPHost =
        this.configService.get<string>('ANTITRUST_EP_HOST');
      const canonicalOrigin = /^[a-z0-9]+:\/\//.test(_canonical)
        ? _canonical
        : `https://${antitrustEPHost}${_canonical}`;
      // const opt = { error: null };
      // const antitrustEPSubRaw = await this.getSub(canonicalOrigin, opt);
      // if (opt.error) {
      //   optIn.error = opt.error;
      //   continue;
      // }
      // if (!antitrustEPSubRaw) {
      //   continue;
      // }

      // const { canonical, contents, keywords } = antitrustEPSubRaw;
      const canonical = canonicalOrigin;
      const entryId = crypto
        .createHash('sha256')
        .update(canonical)
        .digest('base64');

      const preItem = await this.streamEntryService.findOneByEntryId(entryId);

      const createStreamEntries =
        CreateStreamEntries.antitrustEPEntryRawFactory({
          entryId,
          canonical,
          title,
          published,
          content,
        });
      if (!createStreamEntries) {
        continue;
      }

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

  // async getSub(canonical: string, optIn: any): Promise<AafaSubRaw> {
  //   const preItem = await this.streamEntryService.findOne({
  //     where: [{ canonicalUrl: canonical }, { canonicalOrigin: canonical }],
  //   });
  //   if (preItem) {
  //     return null;
  //   }

  //   try {
  //     const start = numeral(moment().format('x')).value();
  //     const response = <any>await this.fetchSub(canonical);

  //     this.logger.log(
  //       numeral(moment().format('x')).value() - start,
  //       'new fetched canonical: ',
  //       canonical,
  //     );

  //     return response.data;
  //   } catch (error) {
  //     optIn.error = error;
  //     this.logger.log(error);
  //     console.log(error);
  //     return null;
  //   }
  // }

  // async fetchSub(canonical: string) {
  //   return new Promise((resolve, reject) => {
  //     const host = this.configService.get<string>('SCRAPINGBEE_HOST');
  //     const url = this.configService.get<string>('SCRAPINGBEE_URL');
  //     const token = this.configService.get<string>('SCRAPINGBEE_TOKEN');

  //     const params = {
  //       url: canonical,
  //       api_key: token,
  //       render_js: false,
  //       extract_rules: {
  //         canonical: {
  //           selector: 'link[rel="canonical"]',
  //           output: '@href',
  //         },
  //         contents: {
  //           selector: '#content .story-content p',
  //           type: 'list',
  //         },
  //         keywords: {
  //           selector: 'meta[name="keywords"]',
  //           output: '@content',
  //         },
  //       },
  //     };

  //     this.httpService
  //       .get(`https://${host}/${url}`, {
  //         params,
  //       })
  //       .subscribe({
  //         next: (_) => resolve(_),
  //         error: (err) => reject(err),
  //       });
  //   });
  // }
}
