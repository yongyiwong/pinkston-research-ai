import { Test, TestingModule } from '@nestjs/testing';
import { FineTuningDataSetService } from './fine-tuning-data-set.service';

describe('FineTuningDataSetService', () => {
  let service: FineTuningDataSetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FineTuningDataSetService],
    }).compile();

    service = module.get<FineTuningDataSetService>(FineTuningDataSetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
