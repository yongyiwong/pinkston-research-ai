import { Module } from '@nestjs/common';
import { StreamEntryService } from './stream-entry.service';
import { StreamEntryController } from './stream-entry.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogModule } from '../log/log.module';
import { StreamEntries } from '../shared/entities/stream-entries.entity';
import { StreamEntryOrigin } from '../shared/entities/stream-entry-origin.entity';
import { StreamEntryOriginService } from './stream-entry-origin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StreamEntries, StreamEntryOrigin]),
    LogModule,
  ],
  controllers: [StreamEntryController],
  providers: [StreamEntryService, StreamEntryOriginService],
  exports: [StreamEntryService, StreamEntryOriginService],
})
export class StreamEntryModule {}
