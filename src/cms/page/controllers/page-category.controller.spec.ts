import { Test, TestingModule } from '@nestjs/testing';
import { PageCategoryController } from './page-category.controller';

describe('PageCategoryController', () => {
  let controller: PageCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageCategoryController],
    }).compile();

    controller = module.get<PageCategoryController>(PageCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
