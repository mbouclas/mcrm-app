import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { EditableRegionsService, IEditableRegionLayout } from "~website/editable-regions/editable-regions.service";

@Controller('api/editable-region')
export class EditableRegionController {
  @Get('executors')
  async getExecutors() {
    return await new EditableRegionsService().getExecutors();
  }

  @Get('/:layoutName/:regionId')
  async getRegion(@Param('layoutName') layoutName: string, @Param('regionId') regionId: string) {
    try {
      return await new EditableRegionsService().findOne({layout: layoutName, region: regionId});
    }
    catch (e) {
      return { success: false, message: e.message };
    }
  }

  @Post('/:layoutName/:regionId')
  async saveRegion(@Param('layoutName') layoutName: string, @Param('regionId') regionId: string, @Body() data: any) {
    try {
      return await new EditableRegionsService().saveRegion({layout: layoutName, region: regionId}, data);
    }
    catch (e) {
      return { success: false, message: e.message };
    }
  }

  @Post('layout')
  async saveLayout(@Body() layout: IEditableRegionLayout) {
    return await new EditableRegionsService().saveLayout(layout);
  }
}
