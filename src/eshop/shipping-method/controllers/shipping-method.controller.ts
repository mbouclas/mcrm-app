import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ShippingMethodService } from '~eshop/shipping-method/services/shipping-method.service';
import { McmsDiContainer } from "~helpers/mcms-component.decorator";

@Controller('api/shipping-method')
export class ShippingMethodController {
  constructor() {}

  @Get('')
  async find(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ShippingMethodService().find(queryParams, rels);
  }

  @Get('providers')
  async providers() {
    return McmsDiContainer.all().filter((item) => item.type === 'shippingMethodProvider').map((item) => ({
      id: item.id.replace('Provider', ''),
      title: item.title,
      description: item.description,
    }));
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ShippingMethodService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    return await new ShippingMethodService().update(uuid, body);
  }

  @Post()
  async store(@Body() body: IGenericObject) {
    return await new ShippingMethodService().store(body);
  }

  @Delete(':id')
  async delete(@Param('id') uuid: string) {
    return await new ShippingMethodService().delete(uuid);
  }


}
