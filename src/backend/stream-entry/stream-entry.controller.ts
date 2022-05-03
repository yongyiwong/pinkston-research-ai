import { Controller } from '@nestjs/common';
import { StreamEntryService } from './stream-entry.service';

@Controller('stream-entry')
export class StreamEntryController {
  constructor(private readonly streamEntryService: StreamEntryService) {}
}
