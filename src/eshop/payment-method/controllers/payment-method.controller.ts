import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { PaymentMethodService } from '~eshop/payment-method/services/payment-method.service';

@Controller('api/payment-method')
export class PaymentMethodController {
  constructor() {}

  @Get('')
  async find(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PaymentMethodService().find(queryParams, rels);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PaymentMethodService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const shippingMethodIds = await new PaymentMethodService().setRelationshipsByIds(
      uuid,
      body.shippingMethodIds,
      'shippingMethod',
    );

    return {
      ...(await new PaymentMethodService().update(uuid, body)),
      shippingMethodIds,
    };
  }

  @Post()
  async store(@Body() body: IGenericObject) {
    return await new PaymentMethodService().store(body);
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new PaymentMethodService().delete(uuid);
  }
}
