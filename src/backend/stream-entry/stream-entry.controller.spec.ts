import { Test, TestingModule } from '@nestjs/testing';
import { StreamEntryController } from './stream-entry.controller';
import { StreamEntryService } from './stream-entry.service';

describe('StreamEntryController', () => {
  let controller: StreamEntryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamEntryController],
      providers: [StreamEntryService],
    }).compile();

    controller = module.get<StreamEntryController>(StreamEntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
