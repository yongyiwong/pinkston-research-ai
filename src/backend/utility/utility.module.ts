import { Module } from '@nestjs/common';
import { FineTuningDataSetModule } from './fine-tuning-data-set/fine-tuning-data-set.module';

@Module({
  imports: [FineTuningDataSetModule],
})
export class UtilityModule {}
