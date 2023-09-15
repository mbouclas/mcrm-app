import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProductService } from '~catalogue/product/services/product.service';
import { SyncEsService } from '~catalogue/sync/sync-es.service';
import { HttpService } from '@nestjs/axios';
import { ElasticSearchService } from '~es/elastic-search.service';
import { ElasticSearchModule } from '~es/elastic-search.module';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';

@Controller('sync/astro/products')
export class ProductsSyncAstroController {
  constructor() {}

  @Get('')
  async products(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rels') rels = undefined,
    @Query('id') uuids = undefined,
  ) {
    const productService = new ProductService();

    const items = await productService.find({ active: true, page, limit, uuids, ...req.query }, rels);

    return items;
  }

  @Get('es')
  async productsEs(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rels') rels = undefined,
    @Query('id') uuids = undefined,
  ) {
    const service = new SyncEsService(new ElasticSearchService(ElasticSearchModule.moduleRef));

    return await service.all(limit, false);
  }

  @Get('categories')
  async categories() {
    const s = new ProductCategoryService();
    return await s.toTree();
  }
}
