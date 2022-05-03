import { Body, Headers, Controller, Get, Query } from '@nestjs/common';
import { FeedlyService } from './feedly.service';

@Controller('feedly')
export class FeedlyController {
  constructor(private readonly feedlyService: FeedlyService) {}

  // @Get('test')
  // test(@Headers() headers, @Body() request, @Query() query) {
  //   console.log(headers);
  //   console.log(request);
  //   console.log(query);
  // }
}
