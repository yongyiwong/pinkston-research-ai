import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { StreamEntryService } from '../stream-entry/stream-entry.service';
import { HttpService } from '@nestjs/axios';
import { Raw } from 'typeorm';
import { StreamEntries } from '../shared/entities/stream-entries.entity';
import { Gpt3ClassificationResponse, Gpt3PromptResponse } from './shared';
import { CreateLog } from '../log/shared/dto/create-logo.dto';
import { LogService } from '../log/log.service';
import { LogTypeEnum } from '../log/shared';
import * as numeral from 'numeral';

@Injectable()
export class Gpt3Service {
  private isBuilding = false;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
  ) {}

  @Cron('* * * * *')
  async handleCron() {
    if (this.isBuilding) {
      return;
    }

    this.isBuilding = true;

    let opt = { lastError: null };
    await this.buildSummaryGpt3(opt);
    if (opt.lastError) {
      this.isBuilding = false;
      return;
    }

    opt = { lastError: null };
    await this.buildCategoryGpt3(opt);
    if (opt.lastError) {
      this.isBuilding = false;
      return;
    }

    opt = { lastError: null };
    await this.build3PStatement(opt);

    opt = { lastError: null };
    await this.buildCategoryAdvancedGpt3(opt);

    this.isBuilding = false;
  }

  async buildSummaryGpt3(optIn: any) {
    const items = await this.streamEntryService.gets2SentenceSummarizable();

    let countFetch = 0;
    let total = 0;
    let countError = 0;
    let lastError = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const opt = { updated: false, error: null, countFetch: 0 };
      await this.buildSummaryGpt3WithEntry(item, opt);

      countFetch += opt.countFetch;
      if (opt.updated) total++;
      if (opt.error) countError++;

      if (countError > 0) {
        optIn.lastError = lastError = opt.error;
        break;
      }
    }

    if (countFetch < 1 && total < 1 && countError < 1 && !lastError) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.GPT3_SUMMARY,
        JSON.stringify({
          totalUpdated: total,
          countFetch,
          countError,
          lastError,
        }),
      ),
    );
    this.logService.save(logItem);
  }

  async buildCategoryGpt3(optIn: any) {
    const items = await this.streamEntryService.find({
      where: {
        categoryGpt3: Raw((alias) => `(${alias} <> '' ) is not true`),
        canonicalUrl: Raw((alias) => `(${alias} <> '' ) is true`),
      },
      relations: ['origin'],
    });

    let countFetch = 0;
    let total = 0;
    let countError = 0;
    let lastError = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const opt = { updated: false, error: null, countFetch: 0 };
      await this.buildCategoryGpt3WithEntry(item, opt);

      countFetch += opt.countFetch;
      if (opt.updated) total++;
      if (opt.error) countError++;

      if (countError > 0) {
        optIn.lastError = lastError = opt.error;
        break;
      }
    }

    if (countFetch < 1 && total < 1 && countError < 1 && !lastError) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.GPT3_CATEGORY,
        JSON.stringify({
          totalUpdated: total,
          countFetch,
          countError,
          lastError,
        }),
      ),
    );
    this.logService.save(logItem);
  }

  async build3PStatement(optIn: any) {
    const items = await this.streamEntryService.find({
      where: {
        summary3pStatement: Raw((alias) => `(${alias} <> '' ) is not true`),
        summaryGpt3: Raw((alias) => `(${alias} <> '' ) is true`),
      },
      relations: ['origin'],
    });

    let countFetch = 0;
    let total = 0;
    let countError = 0;
    let lastError = null;
    for (let i = 0; i < items.length; i++) {
      const opt = { updated: false, error: null, countFetch: 0 };

      const item = items[i];
      if (!item.summaryGpt3.trim()) {
        continue;
      }

      await this.build3PStatementWithEntry(item, opt);

      countFetch += opt.countFetch;
      if (opt.updated) total++;
      if (opt.error) countError++;

      if (countError > 0) {
        optIn.lastError = lastError = opt.error;
        break;
      }
    }

    if (countFetch < 1 && total < 1 && countError < 1 && !lastError) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.GPT3_3PSTATEMENT,
        JSON.stringify({
          totalUpdated: total,
          countFetch,
          countError,
          lastError,
        }),
      ),
    );
    this.logService.save(logItem);
  }

  async buildCategoryAdvancedGpt3(optIn: any) {
    const items = await this.streamEntryService.find({
      where: {
        categoryAdvancedGpt3: Raw((alias) => `(${alias} <> '' ) is not true`),
        summary3pStatement: Raw((alias) => `(${alias} <> '' ) is true`),
      },
      relations: ['origin'],
    });

    let countFetch = 0;
    let total = 0;
    let countError = 0;
    let lastError = null;
    for (let i = 0; i < items.length; i++) {
      const opt = { updated: false, error: null, countFetch: 0 };

      const item = items[i];
      if (!item.summary3pStatement.trim()) {
        continue;
      }

      await this.buildCategoryAdvancedGpt3WithEntry(item, opt);

      countFetch += opt.countFetch;
      if (opt.updated) total++;
      if (opt.error) {
        countError++;
        optIn.lastError = lastError = opt.error;
        continue;
      }
    }

    if (countFetch < 1 && total < 1 && countError < 1 && !lastError) {
      return;
    }

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.GPT3_CATEGORY_ADVANCED,
        JSON.stringify({
          totalUpdated: total,
          countFetch,
          countError,
          lastError,
        }),
      ),
    );
    this.logService.save(logItem);
  }

  async buildSummaryGpt3WithEntry(item: StreamEntries, opt: any) {
    opt.updated = false;
    opt.countFetch = 0;

    if (item.summaryContent || item.content) {
      const optGpt3 = { error: null };

      opt.countFetch++;
      const summaryGpt3 = await this.generateSummaryGpt3(item, optGpt3);
      if (summaryGpt3) {
        item.summaryGpt3 = summaryGpt3;
        if (!opt.updated) opt.updated = true;
      } else if (optGpt3.error) {
        opt.error = optGpt3.error;
        return null;
      } else {
        item.summaryGpt3 = ' ';
      }
    }

    item.updatedGpt3 = item.updated;
    item.amznMentioned = this.streamEntryService.isAmznMentioned(item);
    return await this.streamEntryService.save(item);
  }

  async buildCategoryGpt3WithEntry(item: StreamEntries, opt: any) {
    opt.updated = false;
    opt.countFetch = 0;

    if (item.canonicalUrl) {
      const optGpt3 = { error: null };

      opt.countFetch++;
      const categoryGpt3 = await this.generateCategoryGpt3(item, optGpt3);
      if (categoryGpt3) {
        item.categoryGpt3 = categoryGpt3;
        if (!opt.updated) opt.updated = true;
      } else if (optGpt3.error) {
        opt.error = optGpt3.error;
        return null;
      } else {
        item.categoryGpt3 = ' ';
      }
    }

    item.updatedGpt3 = item.updated;
    item.amznMentioned = this.streamEntryService.isAmznMentioned(item);
    return await this.streamEntryService.save(item);
  }

  async build3PStatementWithEntry(item: StreamEntries, opt: any) {
    opt.updated = false;
    opt.countFetch = 0;

    if (!item.summaryGpt3.trim()) {
      return;
    }

    opt.countFetch++;
    const summary3pStatement = await this.generate3PStatementGpt3(item, opt);
    if (summary3pStatement) {
      item.summary3pStatement = summary3pStatement;
      if (!opt.updated) opt.updated = true;
    } else if (opt.error) {
      opt.error = opt.error;
      return null;
    } else {
      item.summary3pStatement = ' ';
    }

    item.amznMentioned = this.streamEntryService.isAmznMentioned(item);
    await this.streamEntryService.save(item);

    if (!opt.updated) {
      return null;
    }

    return item;
  }

  async buildCategoryAdvancedGpt3WithEntry(item: StreamEntries, opt: any) {
    opt.updated = false;
    opt.countFetch = 0;

    if (!item.summary3pStatement.trim()) {
      return;
    }

    opt.countFetch++;
    const categoryAdvancedGpt3 = await this.generateCategoryAdvancedGpt3(
      item,
      opt,
    );
    if (categoryAdvancedGpt3) {
      item.categoryAdvancedGpt3 = categoryAdvancedGpt3;
      if (!opt.updated) opt.updated = true;
    } else if (opt.error) {
      item.categoryAdvancedGpt3 = ' ';
      opt.error = opt.error;
      return null;
    } else {
      item.categoryAdvancedGpt3 = ' ';
    }

    item.amznMentioned = this.streamEntryService.isAmznMentioned(item);
    await this.streamEntryService.save(item);

    if (!opt.updated) {
      return null;
    }

    return null;
  }

  async generateSummaryGpt3(item: StreamEntries, opt: any) {
    let data: Gpt3PromptResponse;
    try {
      const response = <any>await this.fetchSummaryGpt3(item);
      data = response.data;
    } catch (error) {
      console.log(error);
      opt.error = error;
      return null;
    }

    return data?.choices?.[0]?.text || null;
  }

  async generateCategoryGpt3(item: StreamEntries, opt: any) {
    let data: Gpt3PromptResponse;
    try {
      const response = <any>await this.fetchCategoryGpt3(item);
      data = response.data;
    } catch (error) {
      console.log(error);
      opt.error = error;
      return null;
    }

    return data?.choices?.[0]?.text || null;
  }

  async generate3PStatementGpt3(item: StreamEntries, opt: any) {
    let data: Gpt3PromptResponse;
    try {
      const response = <any>await this.fetch3PStatementGpt3(item);
      data = response.data;
    } catch (error) {
      console.log(error);
      opt.error = error;
      return null;
    }

    return data?.choices?.[0]?.text?.trim() || null;
  }

  async generateCategoryAdvancedGpt3(item: StreamEntries, opt: any) {
    let data: Gpt3ClassificationResponse;
    try {
      const response = <any>await this.fetchCategoryAdvancedGpt3(item);
      data = response.data;
    } catch (error) {
      // console.log(error);
      opt.error = error;
      return null;
    }

    let highScore = 0;
    let label: string = null;
    data.selected_examples.forEach((_) => {
      if (_.score <= highScore) {
        return;
      }
      highScore = _.score;
      label = _.label;
    });

    return label || null;
  }

  async fetchSummaryGpt3(item: StreamEntries) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('OPENAI_HOST');
      const url = this.configService.get<string>('OPENAI_PROMPT_URL');
      const token = this.configService.get<string>('OPENAI_TOKEN');
      const inputContent =
        item.summaryContent ||
        this.getLimitedWords(
          item.content,
          numeral(
            this.configService.get<string>('GPT3_SUMMARY_INPUT_LIMIT_WORDS') ||
              200,
          ).value(),
        );

      const body = {
        prompt: `\"In a TownHall.com Op-ed, SBE Council president &amp; CEO Karen Kerrigan details one of the many problems with the "Build Back Better Act." Specifically, the price controls in the legislation would greatly undermine U.S. investment, innovation and access to new life-saving drugs. Kerrigan writes: "The impact on business would be enormous. An analysis by the […]\" ;\n\nPlease summarize this paragraph in two sentences:In a TownHall.com Op-ed, SBE Council president and CEO Karen Kerrigan details one of the many problems with the "Build Back Better Act." Specifically, the price controls in the legislation would greatly undermine U.S. investment, innovation and access to new life-saving drugs.\n\n\"Ever since the Trump tax bill capped the deduction for state and local taxes (SALT) at $10,000, Democrats from high-tax states have been looking for ways of protecting their constituents from the consequences. With the reconciliation bill, they have found their chance. But their proposal—raising the cap the $80,000—is both bad policy and bad politics.…<div><a title=\\\"View image\\\" href=\\\"https://www.brookings.edu/wp-content/uploads/2021/03/shutterstock_642440497.jpg?w=270\\\"><img border=\\\"0\\\" src=\\\"https://www.brookings.edu/wp-content/uploads/2021/03/shutterstock_642440497.jpg?w=270\\\"></a></div>\\n<div><a title=\\\"Like on Facebook\\\" href=\\\"http://webfeeds.brookings.edu/_/28/673911092/BrookingsRSS/topfeeds/LatestFromBrookings\\\">\" ;\n\nPlease summarize this paragraph in two sentences:Ever since the Trump tax bill capped the deduction for state and local taxes (SALT) at $10,000, Democrats from high-tax states have been looking for ways of protecting their constituents from the consequences. With the reconciliation bill, they have found their chance. But their proposal—raising the cap the $80,000—is both bad policy and bad politics.\n\n${inputContent}\n\nPlease summarize this paragraph in two sentences:`,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ['\n\n'],
      };

      this.httpService
        .post(`https://${host}/${url}`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  async fetchCategoryGpt3(item: StreamEntries) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('OPENAI_HOST');
      const url = this.configService.get<string>('OPENAI_PROMPT_URL');
      const token = this.configService.get<string>('OPENAI_TOKEN');

      const body = {
        prompt: `The following is a list of articles and the categories they fall into\n\nhttps://www.americanactionforum.org/daily-dish/is-the-bbbf-a-climate-bill/:Economy\nhttp://feedproxy.google.com/~r/americansfortaxreform/~3/1rmYwS79pD4/democrat-socialist-spending-bill-includes-corporate-tax-hike-working-families:Economy\nhttps://www.aei.org/technology-and-innovation/the-fcc-takes-key-steps-toward-securing-us-tech-infrastructure/:Science and Technology\nhttps://www.aei.org/economics/americas-labor-shortage-and-the-great-resignation-my-long-read-qa-with-michael-strain/:Workforce\nhttps://www.forbes.com/sites/ikebrannon/2021/10/28/successful-small-brick-and-mortar-retailers-use-online-sales-to-leverage-their-expertise-and-expand-their-customer-base/?sh=3524df4651e0:Small Business\nhttps://nrf.com/blog/how-pandemic-changed-retail-design:Retail\nhttps://netchoice.org/case-study-warby-parker/:Retail\n${item.canonicalUrl}:`,
        temperature: 0,
        max_tokens: 6,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ['\n'],
      };

      this.httpService
        .post(`https://${host}/${url}`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  async fetch3PStatementGpt3(item: StreamEntries) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('OPENAI_HOST');
      const url = this.configService.get<string>('OPENAI_PORMPT_V3BETA_URL');
      const token = this.configService.get<string>('OPENAI_TOKEN');

      const body = {
        prompt:
          `Provide a one sentence summary with an active verb.\n\n` +
          `${item.origin.name} ${item.summaryGpt3}\n`,
        temperature: 0.7,
        max_tokens: 64,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      this.httpService
        .post(`https://${host}/${url}`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  async fetchCategoryAdvancedGpt3(item: StreamEntries) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('OPENAI_HOST');
      const url = this.configService.get<string>('OPENAI_CLASSIFICATION_URL');
      const token = this.configService.get<string>('OPENAI_TOKEN');
      const file = this.configService.get<string>('OPENAI_CLASSIFICATION_FILE');

      const body = {
        file,
        query: item.summary3pStatement,
        search_model: 'ada',
        model: 'curie',
        max_examples: 3,
      };

      this.httpService
        .post(`https://${host}/${url}`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  wordCount(str: string) {
    str = str.replace(/(^\s*)|(\s*$)/gi, '');
    str = str.replace(/[ ]{2,}/gi, ' ');
    str = str.replace(/\n /, '\n');
    return str.split(' ').length;
  }

  getLimitedWords(content: string, limitTotalWords: number) {
    let limitedContent = '';
    let totalWords = 0;
    let matches: any;
    let space: any;

    if (!content) return '';

    while (totalWords < limitTotalWords) {
      matches = content?.match(/\s+/);
      if (!matches || matches.length < 1) {
        limitedContent += content;
        totalWords++;
        break;
      }

      space = matches[0];
      limitedContent += `${content.substring(0, matches.index)}${space}`;
      content = content.substring(matches.index + space.length);
      totalWords++;
    }

    return limitedContent;
  }

  async getSummaryGptWithPrompt(prompt: string) {
    let summary = null;
    try {
      const response = await new Promise<any>((resolve, reject) => {
        const host = this.configService.get<string>('OPENAI_HOST');
        const url = this.configService.get<string>('OPENAI_PROMPT_URL');
        const token = this.configService.get<string>('OPENAI_TOKEN');

        const body = {
          prompt,
          temperature: 0.7,
          max_tokens: 64,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          // temperature: 0,
          // max_tokens: 100,
          // top_p: 1,
          // frequency_penalty: 0,
          // presence_penalty: 0,
          // stop: ['\n\n'],
        };

        this.httpService
          .post(`https://${host}/${url}`, body, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          .subscribe({
            next: (_) => resolve(_),
            error: (err) => reject(err),
          });
      });
      summary = response.data?.choices?.[0]?.text.trim() || null;
    } catch (error) {
      console.log(error);
      return null;
    }

    return summary;
  }
}
