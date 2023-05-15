import { Body, Controller, Delete, Get, Param, Patch, Post, Session, Query } from '@nestjs/common';
import { SessionData } from 'express-session';
import { IGenericObject } from '~models/general';
import { CustomerPaymentMethodService } from '~eshop/customer/services/customer-payment-method.service';
import { CustomerService } from '~eshop/customer/services/customer.service';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';
import handleAsync from '~helpers/handleAsync';

import { McmsDiContainer } from '~helpers/mcms-component.decorator';

import {
  CustomerNotFound,
  CustomerPaymentMehodExists,
  CustomerPaymentMehodFailedCreate,
  ProviderPaymentMethodNotFound,
  CustomerPaymentMethodNotFound,
  CustomerPaymentMethodFailedDelete,
  PaymentMethodNotFound,
} from '../../exceptions';
import { PaymentMethodService } from '~root/eshop/payment-method/services/payment-method.service';

@Controller('api/customer-payment-method')
export class CustomerPaymentMethodController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    const [error, result] = await handleAsync(new CustomerPaymentMethodService().findOne({ uuid }, rels));

    if (error) {
      throw new CustomerPaymentMethodNotFound();
    }

    return result;
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
      }),
    );

    if (customerError) {
      throw new CustomerNotFound();
    }

    const [paymentMethodError, paymentMethod] = await handleAsync(
      new PaymentMethodService().findOne({
        uuid: body.paymentMethodId,
      }),
    );

    if (paymentMethodError) {
      throw new PaymentMethodNotFound();
    }

    const paymentProviderSettings = paymentMethod.providerSettings;

    const providerName = paymentProviderSettings.providerName;

    const paymentProviderContainer = McmsDiContainer.get({
      id: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)}Provider`,
    });

    const provider: IPaymentMethodProvider = new paymentProviderContainer.reference();

    const [paymentInfoError, paymentInfo]: any = await handleAsync(provider.getCardInfo(body.providerPaymentMethodId));

    if (paymentInfoError) {
      throw new ProviderPaymentMethodNotFound();
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
        paymentMethodId: paymentMethod.uuid,
        cardBrand: card.brand,
        cardExpiryMonth: card.expiryMonth,
        cardExpiryYear: card.expiryYear,
        cardLast4: card.last4,
      }),
    );

    if (exists) {
      throw new CustomerPaymentMehodExists();
    }

    await handleAsync(provider.attachPaymentMethod(body.providerPaymentMethodId, customer.customerId));

    const [customerPaymentMethodError, customerPaymentMethodResult] = await handleAsync(
      new CustomerPaymentMethodService().store({
        userId,
        paymentMethodId: paymentMethod.uuid,
        provider: providerName,
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
    const [error, result] = await handleAsync(new CustomerPaymentMethodService().delete(uuid));

    if (error) {
      throw new CustomerPaymentMethodFailedDelete();
    }

    return result;
  }
}
