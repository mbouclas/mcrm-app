import { Controller, Get, Query } from "@nestjs/common";
import { ProductService } from "~catalogue/product/services/product.service";

@Controller('sync/astro/products')
export class ProductsSyncAstroController {
  constructor(
  ) {
  }

  @Get('')
  async products(@Query('page') page = 1, @Query('limit') limit = 10, @Query('rels') rels = undefined, @Query('id') uuids = undefined) {
    const productService = new ProductService();
    const items = await productService.find({active: true, page, limit, uuids}, rels);

    return items;
  }
}
