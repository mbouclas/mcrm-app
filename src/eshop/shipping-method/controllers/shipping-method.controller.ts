import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ShippingMethodService } from '~eshop/shipping-method/services/shipping-method.service';

@Controller('api/shipping-method')
export class ShippingMethodController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ShippingMethodService().findOne({ uuid }, rels);
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) {}

  @Post()
  async store(@Body() data: IGenericObject) {}

  @Delete()
  async delete(@Param('id') uuid: string) {}
}
