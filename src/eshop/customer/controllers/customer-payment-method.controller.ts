import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Session,
  Query,
} from '@nestjs/common';
import { SessionData } from 'express-session';
import { IGenericObject } from '~models/general';
import { CustomerPaymentMethodService } from '~eshop/customer/services/customer-payment-method.service';
import { CustomerService } from '~eshop/customer/services/customer.service';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';

import { McmsDiContainer } from '~helpers/mcms-component.decorator';

@Controller('api/customer-payment-method')
export class CustomerPaymentMethodController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new CustomerPaymentMethodService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    return await new CustomerPaymentMethodService().update(uuid, body);
  }

  @Post()
  async store(@Session() session: SessionData, @Body() body: IGenericObject) {
    const userId = session.user && session.user['uuid'];

    const customer = await new CustomerService().findOne({
      userId,
      provider: body.provider,
    });

    const providerContainer = McmsDiContainer.get({
      id: `StripeProvider`,
    });

    const provider: IPaymentMethodProvider = new providerContainer.reference();

    const paymentInfo: any = await provider.getCardInfo(
      body.providerPaymentMethodId,
    );

    const card = {
      last4: parseInt(paymentInfo.card.last4),
      expiryMonth: paymentInfo.card.exp_month,
      expiryYear: paymentInfo.card.exp_year,
      brand: paymentInfo.card.brand,
    };

    await provider.attachPaymentMethod(
      body.providerPaymentMethodId,
      customer.customerId,
    );

    return await new CustomerPaymentMethodService().store({
      userId,
      provider: body.provider,
      providerPaymentMethodId: body.providerPaymentMethodId,
      card: card,
      providerCustomerId: customer.customerId,
    });
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new CustomerPaymentMethodService().delete(uuid);
  }
}
