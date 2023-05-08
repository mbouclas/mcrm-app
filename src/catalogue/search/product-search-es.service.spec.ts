import { Test, TestingModule } from '@nestjs/testing';
import { ProductSearchEsService } from './product-search-es.service';

describe('ProductSearchEsService', () => {
  let service: ProductSearchEsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSearchEsService],
    }).compile();

    service = module.get<ProductSearchEsService>(ProductSearchEsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
