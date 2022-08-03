import { Module } from '@nestjs/common';
import { ProductModel } from './models/product.model';
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
import { SharedModule } from "~shared/shared.module";
import { ProductCategoryService } from './services/product-category.service';
import { ProductService } from './services/product.service';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ProductModel,
    ProductCategoryModel,
    ProductCategoryService,
    ProductService,

  ]
})
export class ProductModule {}
