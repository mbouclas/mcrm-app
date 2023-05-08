import { Test, TestingModule } from '@nestjs/testing';
import { SimilarProductsSearchService } from './similar-products-search.service';

describe('SimilarProductsSearchService', () => {
  let service: SimilarProductsSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimilarProductsSearchService],
    }).compile();

    service = module.get<SimilarProductsSearchService>(SimilarProductsSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
