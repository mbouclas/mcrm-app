import { Test, TestingModule } from '@nestjs/testing';
import { ImportQueueService } from './import-queue.service';

describe('ImportQueueService', () => {
  let service: ImportQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportQueueService],
    }).compile();

    service = module.get<ImportQueueService>(ImportQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
