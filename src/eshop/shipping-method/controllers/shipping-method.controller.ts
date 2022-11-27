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

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    return await new ShippingMethodService().update(uuid, body);
  }

  @Post()
  async store(@Body() body: IGenericObject) {
    return await new ShippingMethodService().store(body);
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new ShippingMethodService().delete(uuid);
  }
}
