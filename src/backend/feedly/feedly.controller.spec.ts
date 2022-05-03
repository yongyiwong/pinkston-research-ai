import { Test, TestingModule } from '@nestjs/testing';
import { FeedlyController } from './feedly.controller';
import { FeedlyService } from './feedly.service';

describe('FeedlyController', () => {
  let controller: FeedlyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedlyController],
      providers: [FeedlyService],
    }).compile();

    controller = module.get<FeedlyController>(FeedlyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
