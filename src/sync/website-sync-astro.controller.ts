import { Controller, Get, Query } from "@nestjs/common";
import { EditableRegionsService } from "~website/editable-regions/editable-regions.service";
import { store } from "~root/state";

@Controller('sync/astro/website')
export class WebsiteSyncAstroController {
  @Get('editable-regions')
  async getEditableRegions(@Query('groupBy') groupBy = undefined) {
    const service = new EditableRegionsService();
    const res = await service.find();

    if (!groupBy) {
      return res.data;
    }


    return service.groupBy('layout', res.data);
  }
}
