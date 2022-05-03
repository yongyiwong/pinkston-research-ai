import { Test, TestingModule } from '@nestjs/testing';
import { NonRssService } from './non-rss.service';

describe('NonRssService', () => {
  let service: NonRssService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NonRssService],
    }).compile();

    service = module.get<NonRssService>(NonRssService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
