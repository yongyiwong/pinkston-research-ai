import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { /*ApiConsumes,*/ ApiTags } from '@nestjs/swagger';
import { request } from 'express';
import { FineTuningDataSetService } from './fine-tuning-data-set.service';
import {
  FineTuningDataSetSummaryGenerateDto,
  FineTuningDataSetJsonlGenerateDto,
} from './shared';

@Controller('fine-tuning-data-set')
@ApiTags('FineTuning')
export class FineTuningDataSetController {
  constructor(
    private readonly fineTuningDataSetService: FineTuningDataSetService,
  ) {}

  @Post('summary/generate')
  // @ApiConsumes('application/x-www-form-urlencoded')
  @HttpCode(200)
  generate(@Body() request: FineTuningDataSetSummaryGenerateDto) {
    return this.fineTuningDataSetService.generateSummary(request);
  }

  @Post('jsonl/generate')
  @Header('content-type', 'text/plain')
  @HttpCode(200)
  jsonl(@Body() request: FineTuningDataSetJsonlGenerateDto) {
    return this.fineTuningDataSetService.generateJsonl(request);
  }
}
