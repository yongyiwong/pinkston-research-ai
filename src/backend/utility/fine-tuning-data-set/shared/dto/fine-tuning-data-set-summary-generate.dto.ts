import { ApiProperty } from '@nestjs/swagger';
// import { IsNumberString } from 'class-validator';

export class FineTuningDataSetSummaryGenerateDto {
  @ApiProperty({
    default: process.env.FINETUNING_SPREADSHEET_ID,
  })
  spreadsheetId: string;

  @ApiProperty({
    default: process.env.FINETUNING_SHEET_NAME,
  })
  sheetName: string;

  @ApiProperty({
    default: process.env.FINETUNING_RAW_START_CELL,
  })
  rawContentStartCell: string;

  @ApiProperty({
    default: process.env.FINETUNING_RAW_END_CELL,
  })
  rawContentEndCell: string;

  @ApiProperty({
    default: process.env.FINETUNING_RAW_END_CELL,
  })
  rawContentWordCount: number;

  @ApiProperty({
    default: process.env.FINETUNING_SUMMARY_START_CELL,
  })
  summaryStartCell: string;

  @ApiProperty()
  gpt3Prompt: string;
}
