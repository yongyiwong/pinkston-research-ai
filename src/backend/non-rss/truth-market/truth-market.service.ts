import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import { TruthMarketMainRaw, TruthMarketSubRaw } from './shared';
import * as numeral from 'numeral';
import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import * as PDFParser from 'pdf2json';
import * as fs from 'fs';
import {
  CreateStreamEntries,
  StreamEntryOriginHealthEnum,
  StreamOriginEnum,
} from '../../stream-entry/shared';
import { LogTypeEnum } from '../../log/shared';
import { CreateLog } from '../../log/shared/dto/create-logo.dto';
import { StreamEntryOriginService } from '../../stream-entry/stream-entry-origin.service';

@Injectable()
export class TruthMarketService {
  private readonly logger = new Logger(TruthMarketService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
  ) {}

  async getMain() {
    let data: TruthMarketMainRaw;
    let errorLast = null;
    let totalArticles = 0;
    let created = 0;
    let updated = 0;
    this.logger.log('truthMarket started ....');

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

    this.logger.log('truthMarket ended ....');

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
      StreamOriginEnum.NON_RSS_TRUTH_MARKET,
      health,
      note,
    );

    if (created < 1 && updated < 1 && !errorLast) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.NON_RSS_TRUTH_MARKET,
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
      const truthMarketHost =
        this.configService.get<string>('TRUTH_MARKET_HOST');
      const truthMarketMain =
        this.configService.get<string>('TRUTH_MARKET_MAIN');
      const params = {
        url: `https://${truthMarketHost}/${truthMarketMain}`,
        api_key: token,
        render_js: false,
        extract_rules: {
          articles: {
            selector: '.post.format-standard',
            type: 'list',
            output: {
              title: {
                selector: '.post-header h2 a',
              },
              canonical: {
                selector: '.post-header h2 a',
                output: '@href',
              },
              author: {
                selector: '.post-header-meta .the-author a',
              },
              content: {
                selector: '.entry-content',
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

  async getSubs(data: TruthMarketMainRaw, optIn: any) {
    optIn.totals = data.articles?.length || 0;
    optIn.countCreated = 0;
    optIn.countUpdated = 0;

    const itemProcessor = async (item) => {
      const { canonical: _canonical, title, content, author } = item;
      if (!_canonical) {
        optIn.error = 'canonical url is empty';
        return;
      }

      const truthMarketHost =
        this.configService.get<string>('TRUTH_MARKET_HOST');
      const canonicalOrigin = /^[a-z0-9]+:\/\//.test(_canonical)
        ? _canonical
        : `https://${truthMarketHost}${_canonical}`;
      const opt = { error: null };
      const truthMarketSubRaw = await this.getSub(canonicalOrigin, opt);
      if (opt.error) {
        optIn.error = opt.error;
        return;
      }
      if (!truthMarketSubRaw) {
        return;
      }

      const { canonical, description, published } = truthMarketSubRaw;
      const entryId = crypto
        .createHash('sha256')
        .update(canonical)
        .digest('base64');

      const preItem = await this.streamEntryService.findOneByEntryId(entryId);

      const createStreamEntries =
        CreateStreamEntries.truthMarketEntryRawFactory({
          entryId,
          canonical,
          canonicalOrigin,
          title,
          description,
          author,
          published,
          content,
        });
      if (!createStreamEntries) {
        return;
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
    };

    for (let i = 0; i < data.articles?.length; i++) {
      await itemProcessor(data.articles[i]);
    }
  }

  async getSub(canonical: string, optIn: any): Promise<TruthMarketSubRaw> {
    const preItem = await this.streamEntryService.findOne({
      where: [{ canonicalUrl: canonical }, { canonicalOrigin: canonical }],
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
        render_js: false,
        extract_rules: {
          canonical: {
            selector: 'link[rel="canonical"]',
            output: '@href',
          },
          published: {
            selector: 'meta[property="article:published_time"]',
            output: '@content',
          },
          description: {
            selector: 'meta[property="og:description"]',
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

  async getContent(contentUrl) {
    let data = null;
    const pathDir = './tmp';
    const path = `${pathDir}/${this.makeFileName(14)}.pdf`;
    let fileCreated = false;

    try {
      const pathDirExist = await new Promise((resolve) => {
        fs.stat(pathDir, function (err) {
          resolve(!err ? true : false);
        });
      });
      if (!pathDirExist) {
        await fs.promises.mkdir(pathDir, { recursive: true });
      }
      const writer = fs.createWriteStream(path);
      const response = <any>await new Promise((resolve, reject) => {
        this.httpService
          .get(contentUrl, {
            responseType: 'stream',
          })
          .subscribe({
            next: (_) => resolve(_),
            error: (err) => reject(err),
          });
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      fileCreated = true;
      const pdfParser = new PDFParser(this, 1);

      const task = new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (errData) => {
          this.logger.log(errData.parserError);
          reject();
        });

        pdfParser.on('pdfParser_dataReady', () => {
          // fs.writeFile('test.json', JSON.stringify(pdfData), function (err) {
          //   if (err) {
          //     return console.log(err);
          //   }
          //   console.log('The file was saved!');
          // });

          let raw = pdfParser.getRawTextContent().replace(/\r\n/g, ' ');
          raw = raw.replace(/[\-]+Page \(\d+\) Break[\-]+/g, '');

          resolve(raw);
        });
      });

      pdfParser.loadPDF(path);

      data = await task;
    } catch (error) {
      this.logger.log(error);
    }

    if (fileCreated) {
      await new Promise((resolve, reject) => {
        fs.unlink(path, (err) => {
          if (err) reject(err);
          resolve(null);
        });
      });
    }
    return data;
  }

  makeFileName(length) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
