import { ApiProperty } from '@nestjs/swagger';
// import { IsNumberString } from 'class-validator';

export class FineTuningDataSetJsonlGenerateDto {
  @ApiProperty({
    default: process.env.FINETUNING_SPREADSHEET_ID,
  })
  spreadsheetId: string;

  @ApiProperty({
    default: process.env.FINETUNING_SHEET_NAME,
  })
  sheetName: string;

  @ApiProperty({
    default: process.env.FINETUNING_JSONL_SUMMARY_START_CELL,
  })
  summaryStartCell: string;

  @ApiProperty({
    default: process.env.FINETUNING_JSONL_SUMMARY_END_CELL,
  })
  summaryEndCell: string;

  @ApiProperty({
    default: process.env.FINETUNING_JSONL_THREEPSTATMENT_START_CELL,
  })
  threePStatementStartCell: string;
}
