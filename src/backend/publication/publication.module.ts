import { Module } from '@nestjs/common';
import { PublicationService } from './publication.service';
import { PublicationController } from './publication.controller';
import { LogModule } from '../log/log.module';
import { StreamEntryModule } from '../stream-entry/stream-entry.module';
import { HttpModule } from '@nestjs/axios';
import { WashingtonPostService } from './washington-post/washington-post.service';
import { BloombergService } from './bloomberg/bloomberg.service';
import { PoloticoMorningEnergyService } from './politico-morning-energy/politico-morning-energy.service';
import { CommonWealthService } from './commonwealth/common-wealth.service';
import { BusinessInsiderService } from './business-insider/business-insider.service';

@Module({
  imports: [
    LogModule,
    HttpModule.register({
      timeout: 300000,
      maxRedirects: 5,
    }),
    StreamEntryModule,
  ],
  controllers: [PublicationController],
  providers: [
    PublicationService,
    WashingtonPostService,
    BloombergService,
    PoloticoMorningEnergyService,
    CommonWealthService,
    BusinessInsiderService,
  ],
  exports: [PublicationService],
})
export class PublicationModule {}
