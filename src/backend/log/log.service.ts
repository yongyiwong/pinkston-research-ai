import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Log } from '../shared/entities/log.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateLog } from './shared/dto/create-logo.dto';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';
import * as numeral from 'numeral';

@Injectable()
export class LogService {
  constructor(
    private configService: ConfigService,

    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  @Cron('0 0 * * *')
  async handleCron() {
    const maxDays = this.configService.get<string>('LOG_MAX_DAYS') || 5;
    await this.logRepository.delete({
      time: LessThan(
        moment().subtract(numeral(maxDays).value(), 'days').toDate(),
      ),
    });
  }

  create(createLog: CreateLog) {
    return this.logRepository.create(createLog);
  }

  save(item: Log) {
    return this.logRepository.save(item);
  }
}
