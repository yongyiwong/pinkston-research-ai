import { Module } from '@nestjs/common';
import { Gpt3Service } from './gpt3.service';
import { Gpt3Controller } from './gpt3.controller';
import { HttpModule } from '@nestjs/axios';
import { LogModule } from '../log/log.module';
import { StreamEntryModule } from '../stream-entry/stream-entry.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 45000,
      maxRedirects: 5,
    }),
    StreamEntryModule,
    LogModule,
  ],
  controllers: [Gpt3Controller],
  providers: [Gpt3Service],
  exports: [Gpt3Service],
})
export class Gpt3Module {}
