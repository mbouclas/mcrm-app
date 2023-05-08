import { Controller, Get, Query, Req, Session } from "@nestjs/common";
import { ProductSearchEsService } from "~catalogue/search/product-search-es.service";
import { Request } from "express";
import { SyncEsService } from "~catalogue/sync/sync-es.service";
import { HttpService } from "@nestjs/axios";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ElasticSearchModule } from "~es/elastic-search.module";

@Controller('export')
export class ExportController {
  constructor(

  ) {

  }
  @Get('products')
  async products(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10, @Session() session: Record<string, any>) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const service = new SyncEsService(
      new HttpService(),
      new ElasticSearchService(ElasticSearchModule.moduleRef),
    );
    return await service.all(limit, false);
  }
}
