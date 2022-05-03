import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { EntryRawsFetch } from './shared';
import {
  CreateStreamEntries,
  StreamEntryOriginHealthEnum,
  StreamOriginEnum,
} from '../stream-entry/shared';
import { StreamEntryService } from '../stream-entry/stream-entry.service';
import { CreateLog } from '../log/shared/dto/create-logo.dto';
import { LogService } from '../log/log.service';
import * as numeral from 'numeral';
import * as moment from 'moment-timezone';
import { LogTypeEnum } from '../log/shared';
import { StreamEntryOriginService } from '../stream-entry/stream-entry-origin.service';

@Injectable()
export class FeedlyService {
  private readonly logger = new Logger(FeedlyService.name);
  private isBuildingStream = false;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private streamEntryOriginService: StreamEntryOriginService,
  ) {}

  // @Cron('*/30 * * * * *')
  // @Cron('* * * * *')
  @Cron('*/30 * * * *')
  async handleCron() {
    if (this.isBuildingStream) {
      return;
    }

    this.isBuildingStream = true;

    this.logger.log('feedly started ....');

    const maxTotal = numeral(
      this.configService.get<string>('FEEDLY_MAXIMUM_SIZE'),
    ).value();

    let data: EntryRawsFetch;
    let continuation: string = null;
    let total = 0;
    let created = 0;
    let updated = 0;
    const opt = { countCreated: 0, countUpdated: 0, error: null };

    while (true) {
      data = await this.rebuildStream(continuation, opt);
      if (!data) {
        break;
      }
      continuation = data.continuation;

      total += data.items.length;
      created += opt.countCreated;
      updated += opt.countUpdated;
      if (total >= maxTotal) {
        break;
      }

      if (!continuation && continuation.length < 1) {
        break;
      }
    }

    this.isBuildingStream = false;

    this.logger.log('feedly ended ....');

    const logItem = this.logService.create(
      CreateLog.generalFactory(
        LogTypeEnum.FEEDLY,
        JSON.stringify({ totalFetched: total, created, updated }),
      ),
    );
    await this.logService.save(logItem);

    const health =
      total < 1
        ? StreamEntryOriginHealthEnum.OFFLINE
        : StreamEntryOriginHealthEnum.ACTIVE;
    const note =
      health == StreamEntryOriginHealthEnum.ACTIVE
        ? JSON.stringify({ total, created, updated })
        : JSON.stringify(opt.error);
    await this.streamEntryOriginService.updateHealthStatus(
      StreamOriginEnum.FEEDLY,
      health,
      note,
    );
  }

  async rebuildStream(continuation, opt: any) {
    let data: EntryRawsFetch;
    try {
      const response = <any>await this.fetch(continuation);
      data = response.data;
      await this.rebuildStreamWithData(data, opt);
    } catch (error) {
      opt.error = error.response?.data || error;
      this.logger.log(error);
    }

    return data;
  }

  fetch(continuation) {
    return new Promise((resolve, reject) => {
      const host = this.configService.get<string>('FEEDLY_STREAM_HOST');
      const url = this.configService.get<string>('FEEDLY_STREAM_URL');
      const streamId = this.configService.get<string>('FEEDLY_STREAM_ID');
      const token = this.configService.get<string>('FEEDLY_TOKEN');
      const count = this.configService.get<string>('FEEDLY_PAGE_SIZE') || '20';

      const params: any = { streamId, count };
      if (continuation && continuation.length) {
        params.continuation = continuation;
      }

      this.httpService
        .get(`https://${host}/${url}`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .subscribe({
          next: (_) => resolve(_),
          error: (err) => reject(err),
        });
    });
  }

  async rebuildStreamWithData(data: EntryRawsFetch, option: any) {
    const items = data.items;
    const updated = data.updated;

    option.countCreated = 0;
    option.countUpdated = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const preItem = await this.streamEntryService.findOneByEntryId(item.id);

      if (preItem && moment(preItem.updated).format('x') === `${updated}`) {
        continue;
      }

      const originHtmlUrl = item.origin?.htmlUrl;
      const originTitle = item.origin?.title;
      if (!originHtmlUrl || !originTitle) {
        continue;
      }
      const streamEntryOrigin =
        await this.streamEntryOriginService.createIfNeeded(
          originTitle,
          originHtmlUrl,
          true,
        );

      if (!streamEntryOrigin) {
        continue;
      }

      const createStreamEntries = CreateStreamEntries.feedlyEntryRawFactory(
        item,
        {
          updated,
          streamEntryOrigin,
        },
      );

      let createdStreamEntry =
        this.streamEntryService.create(createStreamEntries);
      if (preItem) {
        createdStreamEntry.id = preItem.id;
        option.countUpdated++;
      } else {
        option.countCreated++;
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
}
