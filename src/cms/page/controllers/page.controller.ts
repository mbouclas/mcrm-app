import { Controller, Get, Param, Query } from "@nestjs/common";
import { PageService } from "~cms/page/services/page.service";

@Controller('api/page')
export class PageController {
  constructor(

  ) {
  }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await (new PageService()).find(queryParams, (Array.isArray(queryParams['with']) ? queryParams['with'] : []));
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = (queryParams['with']) ? queryParams['with'] : [];

    return await (new PageService()).findOne({ uuid }, rels);
  }
}
