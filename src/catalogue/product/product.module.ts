import { Module } from '@nestjs/common';
import { ProductModel } from './models/product.model';
import { ProductCategoryModel } from '~catalogue/product/models/product-category.model';
import { SharedModule } from '~shared/shared.module';
import { ProductCategoryService } from './services/product-category.service';
import { ProductService } from './services/product.service';
import { ProductVariantModel } from '~catalogue/product/models/product-variant.model';
import { ProductController } from './controllers/product.controller';
import { ProductVariantService } from './services/product-variant.service';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductVariantController } from './controllers/product-variant.controller';
import { ConditionService } from '~root/setting/condition/services/condition.service';

@Module({
  imports: [SharedModule],
  providers: [
    ProductModel,
    ProductCategoryModel,
    ProductCategoryService,
    ProductVariantModel,
    ProductService,
    ProductVariantService,
    ConditionService,
  ],
  controllers: [ProductController, ProductCategoryController, ProductVariantController],
})
export class ProductModule {}
