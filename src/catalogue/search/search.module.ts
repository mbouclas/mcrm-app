import { Module } from '@nestjs/common';
import { ProductSearchEsService } from './product-search-es.service';
import { SearchController } from './search.controller';
import { SharedModule } from "~shared/shared.module";
import { SimilarProductsSearchService } from './similar-products-search.service';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [ProductSearchEsService, SimilarProductsSearchService],
  controllers: [SearchController]
})
export class SearchModule {}
