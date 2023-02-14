import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSyncAstroController } from './products-sync-astro.controller';

describe('ProductsSyncAstroController', () => {
  let controller: ProductsSyncAstroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsSyncAstroController],
    }).compile();

    controller = module.get<ProductsSyncAstroController>(ProductsSyncAstroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
