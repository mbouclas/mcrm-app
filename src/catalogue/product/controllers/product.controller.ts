import { Controller, Get, Query } from "@nestjs/common";
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
}
