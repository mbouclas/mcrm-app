import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSyncAstroService } from './products-sync-astro.service';

describe('ProductsSyncAstroService', () => {
  let service: ProductsSyncAstroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsSyncAstroService],
    }).compile();

    service = module.get<ProductsSyncAstroService>(ProductsSyncAstroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
