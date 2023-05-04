import { Test, TestingModule } from '@nestjs/testing';
import { SyncEsService } from './sync-es.service';

describe('SyncEsService', () => {
  let service: SyncEsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncEsService],
    }).compile();

    service = module.get<SyncEsService>(SyncEsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
