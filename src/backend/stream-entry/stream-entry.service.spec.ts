import { Test, TestingModule } from '@nestjs/testing';
import { StreamEntryService } from './stream-entry.service';

describe('StreamEntryService', () => {
  let service: StreamEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamEntryService],
    }).compile();

    service = module.get<StreamEntryService>(StreamEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
