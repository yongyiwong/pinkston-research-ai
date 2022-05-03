import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../../log/log.service';
import { StreamEntryService } from '../../stream-entry/stream-entry.service';
import { NaleoMainRaw, NaleoSubRaw } from './shared';
import * as numeral from 'numeral';
import * as crypto from 'crypto';
import * as moment from 'moment-timezone';
import * as fs from 'fs';
import * as PDFParser from 'pdf2json';
import {
  CreateStreamEntries,
  StreamEntryOriginHealthEnum,
  StreamOriginEnum,
} from '../../stream-entry/shared';
import { LogTypeEnum } from '../../log/shared';
import { CreateLog } from '../../log/shared/dto/create-logo.dto';
import { StreamEntryOriginService } from '../../stream-entry/stream-entry-origin.service';

@Injectable()
export class NaleoService {
  private readonly logger = new Logger(NaleoService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
  ) {}

  async getMain() {
    let data: NaleoMainRaw;
    let errorLast = null;
    let totalArticles = 0;
    let created = 0;
    let updated = 0;
    this.logger.log('naleo started ....');

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

    this.logger.log('naleo ended ....');

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
      StreamOriginEnum.NON_RSS_NALEO,
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
      const naleoHost = this.configService.get<string>('NALEO_HOST');
      const naleoMain = this.configService.get<string>('NALEO_MAIN');
      const params = {
        url: `https://${naleoHost}/${naleoMain}`,
        api_key: token,
        render_js: false,
        extract_rules: {
          articles: {
            selector: '.article-body .press_release .release',
            type: 'list',
            output: {
              title: {
                selector: '.name',
              },
              canonical: {
                selector: '.button_wrapper a',
                output: '@href',
              },
              published: {
                selector: '.date',
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

  async getSubs(data: NaleoMainRaw, optIn: any) {
    optIn.totals = data.articles?.length || 0;
    optIn.countCreated = 0;
    optIn.countUpdated = 0;

    for (let i = 0; i < data.articles?.length; i++) {
      const { canonical: _canonical, title, published } = data.articles[i];

      if (!_canonical) {
        optIn.error = 'canonical url is empty';
        continue;
      }

      const naleoHost = this.configService.get<string>('NBCSL_HOST');
      const canonical = /^[a-z0-9]+:\/\//.test(_canonical)
        ? _canonical
        : `https://${naleoHost}${_canonical}`;
      const opt = { error: null };
      const naleoSubRaw = await this.getSub(canonical, opt);
      if (opt.error) {
        optIn.error = opt.error;
        continue;
      }
      if (!naleoSubRaw) {
        continue;
      }

      const { authors, content } = naleoSubRaw;
      const entryId = crypto
        .createHash('sha256')
        .update(canonical)
        .digest('base64');

      const preItem = await this.streamEntryService.findOneByEntryId(entryId);

      const createStreamEntries = CreateStreamEntries.naleoEntryRawFactory({
        entryId,
        canonical,
        title,
        authors,
        content,
        published,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSub(canonical: string, optIn: any): Promise<NaleoSubRaw> {
    const preItem = await this.streamEntryService.findOne({
      where: [{ canonicalUrl: canonical }, { canonicalOrigin: canonical }],
    });
    if (preItem) {
      return null;
    }

    const start = numeral(moment().format('x')).value();
    const data = <any>await this.fetchSub(canonical);

    this.logger.log(
      numeral(moment().format('x')).value() - start,
      'new fetched canonical: ',
      canonical,
    );

    return data;
  }

  async fetchSub(canonical: string) {
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
          .get(canonical, {
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

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          // fs.writeFile('test.json', JSON.stringify(pdfData), function (err) {
          //   if (err) {
          //     return console.log(err);
          //   }
          //   console.log('The file was saved!');
          // });

          const authors = [];

          const texts = pdfData?.Pages?.[0]?.Texts;
          const width = pdfData?.Pages?.[0]?.Width;
          let token = { text: '', fontSize: 0, isLeft: -1, y: -1, sw: -1 };
          let token2 = { text: '', fontSize: 0, sw: -1 };
          let cntToken = 0;
          let cntToken2 = 0;
          let textLatest = '';
          const authorIdxs = [2, 5, 7, 9, 11];

          if (!texts) {
            resolve(null);
            return;
          }

          for (let i = 0; i < texts.length; i++) {
            const _ = texts[i];

            if (_.clr) continue;

            const { T, TS } = _?.R?.[0] || {};
            const isLeft = _?.x < width / 2 - 8 ? 1 : 0;
            const y = _?.y;
            const sw = _?.sw;

            if (!T || !TS) continue;
            const text = decodeURIComponent(T);

            if (
              token.fontSize !== TS[1] ||
              token.isLeft !== isLeft ||
              token.y !== y ||
              token.sw !== sw
            ) {
              if (token.text) {
                const idxAuthor = authorIdxs.indexOf(cntToken);
                if (idxAuthor >= 0) {
                  const matches1 = token.text
                    .trim()
                    .match(/^([a-zA-Z ]+),([a-zA-Z0-9 ]+@[a-zA-Z0-9\.]+)$/);
                  if (matches1 && matches1.length > 2) {
                    authors.push(matches1[1]);
                  } else {
                    const matches2 = token.text.trim().match(/^([a-zA-Z ]+),$/);
                    if (matches2 && matches2.length > 1) {
                      authors.push(matches2[1]);
                    }
                  }
                }
                cntToken++;
              }
              token = { text: '', fontSize: TS[1], isLeft, y, sw };
              if (
                text.trim() &&
                /^[a-zA-Z]+/.test(text.trim()) &&
                !/Contact:/i.test(text.trim()) &&
                TS[1] > 12 &&
                (token2.fontSize !== TS[1] || token2.sw !== sw)
              ) {
                if (cntToken2++ > 2) {
                  textLatest = text.trim();
                  break;
                }
                token2 = { text: '', fontSize: TS[1], sw };
              }
            }

            if (text.trim()) {
              token.text += text;
              token2.text += text;
              // textLatest = text.trim();
            }
          }

          if (!textLatest) {
            return;
          }

          let raw = pdfParser.getRawTextContent().replace(/\r\n/g, ' ');
          raw = raw.replace(/[\-]+Page \(\d+\) Break[\-]+/g, '');

          try {
            const matches = raw.match(new RegExp(`${textLatest}.+`));
            if (!matches || matches.legth < 1) {
              resolve(null);
              return null;
            }
            const content = matches[0].trim();
            resolve({ authors, content });
          } catch (error) {
            reject(error);
            return null;
          }
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
