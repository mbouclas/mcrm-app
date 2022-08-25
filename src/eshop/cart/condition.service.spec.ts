import { Test, TestingModule } from '@nestjs/testing';
import { ConditionService } from './condition.service';

describe('ConditionService', () => {
  let service: ConditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConditionService],
    }).compile();

    service = module.get<ConditionService>(ConditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
