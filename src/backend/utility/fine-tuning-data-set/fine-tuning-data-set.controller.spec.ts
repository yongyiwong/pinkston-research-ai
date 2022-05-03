import { Test, TestingModule } from '@nestjs/testing';
import { FineTuningDataSetController } from './fine-tuning-data-set.controller';
import { FineTuningDataSetService } from './fine-tuning-data-set.service';

describe('FineTuningDataSetController', () => {
  let controller: FineTuningDataSetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FineTuningDataSetController],
      providers: [FineTuningDataSetService],
    }).compile();

    controller = module.get<FineTuningDataSetController>(
      FineTuningDataSetController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
