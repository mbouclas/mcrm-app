import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { PaymentMethodService } from '~eshop/payment-method/services/payment-method.service';
import { IPaymentMethodProvider } from "~eshop/payment-method/models/providers.types";

@Controller('api/payment-method')
export class PaymentMethodController {
  constructor() {}

  @Get('providers')
  async getProviders() {
    return new PaymentMethodService().getProviders(true);

  }

  @Get('')
  async find(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];
    const res = await new PaymentMethodService().find(queryParams, rels);
    res.data = res.data.map((item) => {
      item.provider = PaymentMethodService.getProviderForApiUse(item.providerName) as unknown as IPaymentMethodProvider

      return item;
    });

    return res;
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    const res = await new PaymentMethodService().findOne({ uuid }, rels);

    res.provider = PaymentMethodService.getProviderForApiUse(res.providerName) as unknown as IPaymentMethodProvider;
    return res;
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    let postedShippingMethodIds = body.shippingMethodIds || [];
    if (!body.shippingMethodIds && body.shippingMethod) {
      postedShippingMethodIds = body.shippingMethod.map((item) => item.uuid);
    }

    const shippingMethodIds = await new PaymentMethodService().setRelationshipsByIds(
      uuid,
      postedShippingMethodIds,
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
