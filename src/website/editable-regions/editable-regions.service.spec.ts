import { Test, TestingModule } from '@nestjs/testing';
import { EditableRegionsService } from './editable-regions.service';

describe('EditableRegionsService', () => {
  let service: EditableRegionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditableRegionsService],
    }).compile();

    service = module.get<EditableRegionsService>(EditableRegionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
