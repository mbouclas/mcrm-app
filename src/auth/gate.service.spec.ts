import { Test, TestingModule } from '@nestjs/testing';
import { GateService } from './gate.service';

describe('GateService', () => {
  let service: GateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GateService],
    }).compile();

    service = module.get<GateService>(GateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
