import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PropertyValueService } from "~catalogue/property/services/propertyValue.service";
import { IGenericObject } from "~models/general";
import { PropertyValueModel } from "~catalogue/property/models/property-value.model";


@Controller('api/property-value')
export class PropertyValueController {
  @Get()
  async find(@Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new PropertyValueService().find(queryParams, rels);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new PropertyValueService().findOne({ uuid }, rels);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Post()
  async store(@Body() body: Partial<PropertyValueModel>) {
    return await new PropertyValueService().store(body);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    try {
      return await new PropertyValueService().update(uuid, { ...body });
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new PropertyValueService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
