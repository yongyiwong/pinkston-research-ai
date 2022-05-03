import { Controller } from '@nestjs/common';
import { Gpt3Service } from './gpt3.service';

@Controller('gpt3')
export class Gpt3Controller {
  constructor(private readonly gpt3Service: Gpt3Service) {}
}
