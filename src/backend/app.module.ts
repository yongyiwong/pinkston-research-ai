import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeedlyModule } from './feedly/feedly.module';
import { Gpt3Module } from './gpt3/gpt3.module';
import { NonRssModule } from './non-rss/non-rss.module';
import { UtilityModule } from './utility/utility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(),
    ScheduleModule.forRoot(),
    FeedlyModule,
    Gpt3Module,
    NonRssModule,
    UtilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
