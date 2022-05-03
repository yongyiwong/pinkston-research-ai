import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as numeral from 'numeral';
import { google, sheets_v4 } from 'googleapis';
import { Gpt3Service } from 'src/backend/gpt3/gpt3.service';
import {
  FineTuningDataSetJsonlGenerateResponseDto,
  FineTuningDataSetSummaryGenerateDto,
  FineTuningDataSetSummaryGenerateResponseDto,
  FineTuningDataSetJsonlGenerateDto,
} from './shared';

@Injectable()
export class FineTuningDataSetService {
  sheets: sheets_v4.Sheets;

  constructor(
    private configService: ConfigService,
    private gpt3Service: Gpt3Service,
  ) {
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const credentialPath =
        this.configService.get<string>('GOOGLE_CREDENTIAL');
      fs.readFile(credentialPath, 'utf-8', async (err, content) => {
        if (err) {
          return reject(err);
        }
        try {
          const credentials = JSON.parse(content);
          const scopes = JSON.parse(
            this.configService.get<string>('GOOGLE_SCOPES'),
          );

          const authClient = await google.auth.getClient({
            credentials,
            scopes,
          });

          google.options({ auth: authClient });

          this.sheets = google.sheets('v4');
        } catch (error) {
          return reject(error);
        }

        return resolve(this.sheets);
      });
    });
  }

  async generateSummary(request: FineTuningDataSetSummaryGenerateDto) {
    const response = new FineTuningDataSetSummaryGenerateResponseDto();
    response.result = false;

    let matches = request.summaryStartCell.match(/^([a-zA-Z]+)([0-9]+)$/);
    if (matches.length < 3) {
      response.message = 'summary start cell is invalid';
      return response;
    }
    const summaryStartCellX = matches[1];
    const summaryStartCellY = numeral(matches[2]).value();

    matches = request.gpt3Prompt.match(/(^.*?)\$\{inputContent\}(.*$)/ims);
    if (!matches || matches.length < 3) {
      response.message = 'Gpt3prompt format is invalid';
      return response;
    }
    const beforePrompt = matches[1];
    const afterPrompt = matches[2];

    const rawContents = await this.getRawContents(request);

    let prompt = '';
    let summaryList: string[][] = [];
    let range = '';
    const blockSize = 5;
    let iBlockStart = 0;
    for (let i = 0; i < rawContents.length; i++) {
      const rawContent: string = rawContents[i][0];
      const limitedRawContent = this.gpt3Service.getLimitedWords(
        rawContent,
        request.rawContentWordCount,
      );
      prompt = `${beforePrompt}${limitedRawContent}${afterPrompt}`;
      const summary = await this.gpt3Service.getSummaryGptWithPrompt(prompt);

      summaryList.push([summary]);

      if (i % blockSize === blockSize - 1) {
        range =
          `${request.sheetName}` +
          `!${summaryStartCellX}${summaryStartCellY + iBlockStart}:` +
          `${summaryStartCellX}${summaryStartCellY + i}`;
        await this.updateSummary(request, summaryList, range);
        summaryList = [];
        iBlockStart = i + 1;
      }
    }
    if (summaryList.length > 0) {
      range =
        `${request.sheetName}` +
        `!${summaryStartCellX}${summaryStartCellY + iBlockStart}:` +
        `${summaryStartCellX}${
          summaryStartCellY + iBlockStart + summaryList.length - 1
        }`;

      await this.updateSummary(request, summaryList, range);
    }
    response.result = true;
    return response;
  }

  async getRawContents(request: FineTuningDataSetSummaryGenerateDto) {
    try {
      const result = await this.sheets.spreadsheets.values.get({
        spreadsheetId: request.spreadsheetId,
        range: `${request.sheetName}!${request.rawContentStartCell}:${request.rawContentEndCell}`,
      });

      return result.data.values;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async updateSummary(
    request: FineTuningDataSetSummaryGenerateDto,
    summaryList: string[][],
    range: string,
  ) {
    let result;
    try {
      result = await new Promise((resolve, reject) => {
        const values = summaryList;
        const data = [
          {
            range,
            values,
          },
        ];
        console.log(data);
        const resource = {
          data,
          valueInputOption: 'RAW',
        };
        this.sheets.spreadsheets.values.batchUpdate(
          {
            spreadsheetId: request.spreadsheetId,
            requestBody: resource,
          },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          },
        );
      });
    } catch (error) {
      console.log(error);
      return false;
    }

    console.log('%d cells updated.', result.totalUpdatedCells);
    return true;
  }

  async generateJsonl(request: FineTuningDataSetJsonlGenerateDto) {
    const { threePStatement, summary } =
      (await this.getSummaryAnd3PStatement(request)) || {};

    if (!threePStatement || !summary) {
      throw new HttpException(
        'fetching data cause error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let jsonl: string = '';
    for (let i = 0; i < threePStatement.length; i++) {
      const _3PStatement = threePStatement[i][0].trim();
      const _summary = summary[i][0]?.trim();

      if (!_summary || !_3PStatement) {
        continue;
      }

      jsonl +=
        `${jsonl.length > 0 ? '\n' : ''}` +
        JSON.stringify({ prompt: _summary, completion: _3PStatement });
    }

    return jsonl;
  }

  async getSummaryAnd3PStatement(
    request: FineTuningDataSetJsonlGenerateDto,
  ): Promise<any> {
    let matches = request.threePStatementStartCell.match(
      /^([a-zA-Z]+)([0-9]+)$/,
    );
    if (matches.length < 3) {
      return null;
    }
    const threePStatementStartCellX = matches[1];
    const threePStatementStartCellY = numeral(matches[2]).value();

    matches = request.summaryStartCell.match(/^([a-zA-Z]+)([0-9]+)$/);
    if (matches.length < 3) {
      return null;
    }
    const summaryStartCellX = matches[1];
    const summaryStartCellY = numeral(matches[2]).value();

    matches = request.summaryEndCell.match(/^([a-zA-Z]+)([0-9]+)$/);
    if (matches.length < 3) {
      return null;
    }
    const summaryEndCellX = matches[1];
    const summaryEndCellY = numeral(matches[2]).value();

    const threePStatementEndCellY =
      threePStatementStartCellY + summaryEndCellY - summaryStartCellY;

    try {
      let result = await this.sheets.spreadsheets.values.get({
        spreadsheetId: request.spreadsheetId,
        range:
          `${request.sheetName}!` +
          `${request.threePStatementStartCell}` +
          `:${threePStatementStartCellX}${threePStatementEndCellY}`,
      });

      const threePStatement = result.data.values;

      result = await this.sheets.spreadsheets.values.get({
        spreadsheetId: request.spreadsheetId,
        range:
          `${request.sheetName}!` +
          `${request.summaryStartCell}` +
          `:${request.summaryEndCell}`,
      });

      const summary = result.data.values;

      return { threePStatement, summary };
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
