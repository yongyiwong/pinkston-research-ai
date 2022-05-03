import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import * as numeral from 'numeral';
// import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import { BusinessInsiderRaw } from './shared';
import { PublicationRaw } from '../shared';

@Injectable()
export class BusinessInsiderService {
  private readonly logger = new Logger(BusinessInsiderService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
  ) {}

  async getSub(canonical: string, optIn: any) {
    const preItem = await this.streamEntryService.findOne({
      where: [{ canonicalUrl: canonical }, { canonicalOrigin: canonical }],
    });
    if (preItem) {
      return null;
    }

    let data: BusinessInsiderRaw;
    let countFailed = 0;
    const maxFailed = 3;

    while (true) {
      try {
        const start = numeral(moment().format('x')).value();
        const response = <any>await this.fetchSub(canonical);

        this.logger.log(
          numeral(moment().format('x')).value() - start,
          'new fetched canonical: ',
          canonical,
        );

        data = response.data;

        if (!data.canonical) {
          if (countFailed++ < maxFailed) continue;
          return null;
        }
      } catch (error) {
        optIn.error = error;
        this.logger.log(error);
        console.log(error);
        return null;
      }
      break;
    }

    const publicationRaw = PublicationRaw.businessInsiderFactory(data);
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
        render_js: false,
        extract_rules: JSON.stringify({
          contents: {
            selector: '.content-lock-content >p',
            type: 'list',
          },
          author: {
            selector: 'meta[property="author"]',
            output: '@content',
          },
          published: {
            selector: `meta[name="pubdate"]`,
            output: '@content',
          },
          canonical: {
            selector: `link[rel="canonical"]`,
            output: '@href',
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
}
