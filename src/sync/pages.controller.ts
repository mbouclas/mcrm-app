import { Controller, Get, Query } from "@nestjs/common";
import { PageService } from "~cms/page/services/page.service";

@Controller('sync/astro/pages')
export class PagesController {
  @Get('')
  async pages(@Query() queryParams = {}) {
    return await new PageService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }
}
