import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductService } from "~catalogue/product/services/product.service";

@Controller('api/product')
export class ProductController {
  constructor(

  ) {
  }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await (new ProductService()).find(queryParams, (Array.isArray(queryParams['with']) ? queryParams['with'] : []));
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = (queryParams['with']) ? queryParams['with'] : [];

    return await (new ProductService()).findOne({ uuid }, rels);
  }
}
