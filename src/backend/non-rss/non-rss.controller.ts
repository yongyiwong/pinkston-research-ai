import { Controller } from '@nestjs/common';
import { NonRssService } from './non-rss.service';

@Controller('non-rss')
export class NonRssController {
  constructor(private readonly nonRssService: NonRssService) {}
}
