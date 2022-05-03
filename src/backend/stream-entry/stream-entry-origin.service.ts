import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
  SaveOptions,
} from 'typeorm';
import { StreamEntryOrigin } from '../shared/entities/stream-entry-origin.entity';
import { StreamEntryOriginHealthEnum, StreamOriginEnum } from './shared';
import { CreateStreamEntryOrigin } from './shared/dto/create-streamEntryOrigin.dto';

@Injectable()
export class StreamEntryOriginService {
  private readonly logger = new Logger(StreamEntryOriginService.name);

  constructor(
    @InjectRepository(StreamEntryOrigin)
    private streamEntryOriginRepository: Repository<StreamEntryOrigin>,
  ) {}

  save(item: StreamEntryOrigin, options?: SaveOptions) {
    return this.streamEntryOriginRepository.save(item, options);
  }

  find(options: FindManyOptions) {
    return this.streamEntryOriginRepository.find(options);
  }

  findOne(option: FindOneOptions) {
    return this.streamEntryOriginRepository.findOne(option);
  }

  findOneById(id: number, option?: FindOneOptions) {
    return this.streamEntryOriginRepository.findOne(id, option);
  }

  async updateHealthStatus(
    id: number,
    health: StreamEntryOriginHealthEnum,
    note = '',
  ) {
    if (id !== StreamOriginEnum.FEEDLY) {
      const item = await this.streamEntryOriginRepository.findOne(id);
      if (!item) {
        return null;
      }

      item.health = health;
      item.note = note;
      item.updated = new Date();

      return this.streamEntryOriginRepository.save(item);
    }

    return this.streamEntryOriginRepository.update(
      { fromFeedly: true },
      { health, note, updated: new Date() },
    );
  }

  async createIfNeeded(
    name: string,
    htmlUrl: string,
    fromFeedly: boolean,
  ): Promise<StreamEntryOrigin> {
    const preItem = await this.streamEntryOriginRepository.findOne({
      where: { htmlUrl },
    });

    if (preItem) {
      return preItem;
    }

    const createStreamEntryOrigin = new CreateStreamEntryOrigin();
    createStreamEntryOrigin.name = name;
    createStreamEntryOrigin.htmlUrl = htmlUrl;
    createStreamEntryOrigin.fromFeedly = fromFeedly;
    createStreamEntryOrigin.health = StreamEntryOriginHealthEnum.ACTIVE;

    let item = this.streamEntryOriginRepository.create(createStreamEntryOrigin);

    item = await this.streamEntryOriginRepository.save(item);

    return this.streamEntryOriginRepository.findOne(item.id);
  }
}
