import { Test, TestingModule } from '@nestjs/testing';
import { UploaderQueueService } from './uploader-queue.service';

describe('UploaderQueueService', () => {
  let service: UploaderQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploaderQueueService],
    }).compile();

    service = module.get<UploaderQueueService>(UploaderQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
