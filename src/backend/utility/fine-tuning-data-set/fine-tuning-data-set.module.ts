import { Module } from '@nestjs/common';
import { FineTuningDataSetService } from './fine-tuning-data-set.service';
import { FineTuningDataSetController } from './fine-tuning-data-set.controller';
import { Gpt3Module } from 'src/backend/gpt3/gpt3.module';

@Module({
  imports: [Gpt3Module],
  controllers: [FineTuningDataSetController],
  providers: [FineTuningDataSetService],
})
export class FineTuningDataSetModule {}
