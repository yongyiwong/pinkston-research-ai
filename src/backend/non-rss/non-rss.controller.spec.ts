import { Test, TestingModule } from '@nestjs/testing';
import { NonRssController } from './non-rss.controller';
import { NonRssService } from './non-rss.service';

describe('NonRssController', () => {
  let controller: NonRssController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NonRssController],
      providers: [NonRssService],
    }).compile();

    controller = module.get<NonRssController>(NonRssController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
