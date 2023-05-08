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
import handleAsync from '~helpers/handleAsync';

import { McmsDiContainer } from '~helpers/mcms-component.decorator';

import {
  CustomerDoesNotExist,
  CustomerPaymentMehodExists,
  CustomerPaymentMehodFailedCreate,
  ProviderPaymentMethodDoesNotExist,
} from '../../exceptions';

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

    const [customerError, customer] = await handleAsync(
      new CustomerService().findOne({
        userId,
        provider: body.provider,
      }),
    );

    if (customerError) {
      throw new CustomerDoesNotExist();
    }

    const providerContainer = McmsDiContainer.get({
      id: `StripeProvider`,
    });

    const provider: IPaymentMethodProvider = new providerContainer.reference();

    const [paymentInfoError, paymentInfo]: any = await handleAsync(
      provider.getCardInfo(body.providerPaymentMethodId),
    );

    if (paymentInfoError) {
      throw new ProviderPaymentMethodDoesNotExist();
    }

    const card = {
      last4: parseInt(paymentInfo.card.last4),
      expiryMonth: parseInt(paymentInfo.card.exp_month),
      expiryYear: parseInt(paymentInfo.card.exp_year),
      brand: paymentInfo.card.brand,
    };

    const [error, exists] = await handleAsync(
      new CustomerPaymentMethodService().findOne({
        providerCustomerId: customer.customerId,
        provider: body.provider,
        cardBrand: card.brand,
        cardExpiryMonth: card.expiryMonth,
        cardExpiryYear: card.expiryYear,
        cardLast4: card.last4,
      }),
    );

    if (exists) {
      throw new CustomerPaymentMehodExists();
    }

    await handleAsync(
      provider.attachPaymentMethod(
        body.providerPaymentMethodId,
        customer.customerId,
      ),
    );

    const [customerPaymentMethodError, customerPaymentMethodResult] =
      await handleAsync(
        new CustomerPaymentMethodService().store({
          userId,
          provider: body.provider,
          providerPaymentMethodId: body.providerPaymentMethodId,
          card: card,
          providerCustomerId: customer.customerId,
        }),
      );

    if (customerPaymentMethodError) {
      throw new CustomerPaymentMehodFailedCreate();
    }

    return customerPaymentMethodResult;
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new CustomerPaymentMethodService().delete(uuid);
  }
}
