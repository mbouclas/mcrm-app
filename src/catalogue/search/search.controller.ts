import { Controller, Get, Query, Req, Session } from "@nestjs/common";
import { Request } from "express";
import { ProductSearchEsService } from "~catalogue/search/product-search-es.service";
import { SimilarProductsSearchService } from "~catalogue/search/similar-products-search.service";

@Controller('search')
export class SearchController {
  constructor(
    protected searchService: ProductSearchEsService
  ) {
  }

  @Get('')
  async search(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10, @Session() session: Record<string, any>) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;

    return await this.searchService
      .setDebugMode(true)
      .filter({limit, page, queryParameters, q: qs}, true);
  }

  /**
   * /search/similar?id=0aa0d5d5-e509-46fe-9ee9-ff57e1c9542b&fields[]=properties
   * fields is not required, just when you want to search against a specific field
   * @param req
   * @param id
   * @param limit
   * @param fields
   * @param session
   */
  @Get('similar')
  async findSimilar(@Req() req: Request, @Query('id') id: string, @Query('limit') limit = 10, @Query('fields') fields = [], @Session() session: Record<string, any>) {
    const page = req.query.page || 1 as any;

    return await (new SimilarProductsSearchService(this.searchService.getEs())).search(id, {limit, page}, null, fields)
  }
}
