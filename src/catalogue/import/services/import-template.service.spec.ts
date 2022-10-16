import { Test, TestingModule } from '@nestjs/testing';
import { ImportTemplateService } from './import-template.service';

describe('ImportTemplateService', () => {
  let service: ImportTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportTemplateService],
    }).compile();

    service = module.get<ImportTemplateService>(ImportTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
