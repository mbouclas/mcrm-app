import { Test, TestingModule } from '@nestjs/testing';
import { CsvProcessorService } from './csv-processor.service';

describe('CsvProcessorService', () => {
  let service: CsvProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvProcessorService],
    }).compile();

    service = module.get<CsvProcessorService>(CsvProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
