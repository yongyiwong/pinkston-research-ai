import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import * as numeral from 'numeral';
// import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import { WashingtonPostRaw } from './shared';
import { PublicationRaw } from '../shared';

@Injectable()
export class WashingtonPostService {
  private readonly logger = new Logger(WashingtonPostService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
  ) {}

  async getSub(canonical: string, optIn: any) {
    const preItem = await this.streamEntryService.findOne({
      where: { canonicalUrl: canonical },
    });
    if (preItem) {
      return null;
    }

    let data: WashingtonPostRaw;
    try {
      const start = numeral(moment().format('x')).value();
      const response = <any>await this.fetchSub(canonical);

      this.logger.log(
        numeral(moment().format('x')).value() - start,
        'new fetched canonical: ',
        canonical,
      );

      data = response.data;
    } catch (error) {
      optIn.error = error;
      this.logger.log(error);
      console.log(error);
      return null;
    }

    const publicationRaw = PublicationRaw.washingtonPostFactory(data);
    return publicationRaw;
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
            selector: '.article-body .teaser-content',
          },
          author: {
            selector: '[data-qa="author-name"]',
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
