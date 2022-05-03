import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
  SaveOptions,
} from 'typeorm';
import { StreamEntries } from '../shared/entities/stream-entries.entity';
import { CreateStreamEntries } from './shared';

@Injectable()
export class StreamEntryService {
  private readonly logger = new Logger(StreamEntryService.name);

  constructor(
    @InjectRepository(StreamEntries)
    private streamEntryRepository: Repository<StreamEntries>,
  ) {}

  create(createStreamEntry: CreateStreamEntries) {
    return this.streamEntryRepository.create(createStreamEntry);
  }

  save(item: StreamEntries, options?: SaveOptions) {
    return this.streamEntryRepository.save(item, options);
  }

  findOneByEntryId(entryId: string) {
    return this.streamEntryRepository.findOne({ entryId });
  }

  find(options: FindManyOptions) {
    return this.streamEntryRepository.find(options);
  }

  findOne(option: FindOneOptions) {
    return this.streamEntryRepository.findOne(option);
  }

  findOneById(id: number, option?: FindOneOptions) {
    return this.streamEntryRepository.findOne(id, option);
  }

  isAmznMentioned(item: StreamEntries) {
    const pattern = /AMZN|amazon/i;

    if (item.content && pattern.test(item.content)) {
      return true;
    }

    if (item.summaryContent && pattern.test(item.summaryContent)) {
      return true;
    }

    if (item.summaryGpt3 && pattern.test(item.summaryGpt3)) {
      return true;
    }

    if (item.summary3pStatement && pattern.test(item.summary3pStatement)) {
      return true;
    }

    if (item.keywords && pattern.test(item.keywords)) {
      return true;
    }

    if (item.categoryGpt3 && pattern.test(item.categoryGpt3)) {
      return true;
    }

    if (item.title && pattern.test(item.title)) {
      return true;
    }

    if (item.originTitle && pattern.test(item.originTitle)) {
      return true;
    }

    if (item.author && pattern.test(item.author)) {
      return true;
    }

    if (item.canonicalUrl && pattern.test(item.canonicalUrl)) {
      return true;
    }

    if (item.commonTopics && pattern.test(item.commonTopics)) {
      return true;
    }

    if (item.entities && pattern.test(item.entities)) {
      return true;
    }

    return false;
  }

  gets2SentenceSummarizable() {
    return this.streamEntryRepository
      .createQueryBuilder('se')
      .leftJoinAndSelect("se.origin", "origin")
      .where(`(se.summaryGpt3 <> '' ) is not true`)
      .andWhere(
        `((se.summaryContent <> '' ) is true OR (se.content <> '' ) is true)`,
      )
      .getMany();
  }
}
