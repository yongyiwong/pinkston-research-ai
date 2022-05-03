import { Test, TestingModule } from '@nestjs/testing';
import { FeedlyService } from './feedly.service';

describe('FeedlyService', () => {
  let service: FeedlyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedlyService],
    }).compile();

    service = module.get<FeedlyService>(FeedlyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
