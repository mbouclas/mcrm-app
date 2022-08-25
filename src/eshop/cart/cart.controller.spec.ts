import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from "~eshop/cart/cart.service";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";

describe('CartController', () => {
  let controller: CartController;
  let cartService: CartService;
  let pcs: ProductCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
    }).compile();

    controller = module.get<CartController>(CartController);
    cartService = new CartService();
    pcs = new ProductCategoryService();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
