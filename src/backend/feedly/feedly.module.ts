import { Module } from '@nestjs/common';
import { FeedlyService } from './feedly.service';
import { FeedlyController } from './feedly.controller';
import { HttpModule } from '@nestjs/axios';
import { LogModule } from '../log/log.module';
import { StreamEntryModule } from '../stream-entry/stream-entry.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 45000,
      maxRedirects: 5,
    }),
    LogModule,
    StreamEntryModule,
  ],
  controllers: [FeedlyController],
  providers: [FeedlyService],
  exports: [FeedlyService],
})
export class FeedlyModule {}
