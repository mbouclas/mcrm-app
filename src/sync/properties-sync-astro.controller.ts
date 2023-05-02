import { Controller, Get, Query } from "@nestjs/common";
import { PropertyService } from "~catalogue/property/property.service";

@Controller('sync/astro/properties')
export class PropertiesSyncAstroController {
  @Get('')
  async get(@Query('page') page = 1, @Query('limit') limit = 10, @Query('rels') rels = undefined) {
    const service = new PropertyService();
    return await service.find({active: true, page, limit}, rels);
  }
}
