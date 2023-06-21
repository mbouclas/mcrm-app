import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Session } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderService } from '~eshop/order/services/order.service';
import { CustomerService } from '~eshop/customer/services/customer.service';
import { CustomerPaymentMethodService } from '~eshop/customer/services/customer-payment-method.service';
import { AddressService } from '~eshop/address/services/address.service';
import { ProductService } from '~root/catalogue/product/services/product.service';
import handleAsync from '~helpers/handleAsync';
import { CartService } from '~eshop/cart/cart.service';
import { SessionData } from 'express-session';
import { PaymentMethodService } from '~root/eshop/payment-method/services/payment-method.service';
import { ShippingMethodService } from '~root/eshop/shipping-method/services/shipping-method.service';
import { UserService } from '~root/user/services/user.service';
import { store } from '~root/state';
import { ProductModel } from '~root/catalogue/product/models/product.model';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';
import { IShippingMethodProvider } from '~eshop/shipping-method/models/providers.types';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';

import {
  BillingAddressNotFound,
  ShippingAddressNotFound,
  OrderFailed,
  OrderNotFound,
  PaymentMethodNotFound,
  CustomerPaymentMethodNotFound,
  ShippingMethodNotFound,
  ShippingMethodFaildTransaction,
  PaymentMethodFailedTransaction,
  CustomerNotFound,
} from '../../exceptions';

@Controller('api/order')
export class OrderController {
  constructor() {}

  @Get()
  async find(@Session() session: SessionData, @Query() queryParams = {}) {
    const userId = session.user && session.user['uuid'];
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findAll({}, rels);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    const [error, result] = await handleAsync(new OrderService().findOne({ uuid }, rels));

    if (error) {
      throw new OrderNotFound();
    }

    return result;
  }

  @Post('/webhooks')
  async webhook(@Body() body: IGenericObject) {
    if (body.type === 'payment_intent.succeeded') {
      const clientSecret = body.data.client_secret;

      // clientSecret = 'pi_3MMaBpFVnCuD42ua2CDyjXPL_secret_BwHVPZzQYElqvG9LZgwjdHSCj';

      const order = await new OrderService().findByRegex('paymentInfo', clientSecret);

      if (order) {
        const paymentInfo = JSON.parse(order.paymentInfo);

        const withSuccessStatus = JSON.stringify({
          ...paymentInfo,
          status: 'SUCCESS',
        });

        await new OrderService().update(order.uuid, {
          paymentInfo: withSuccessStatus,
        });
      }
    }

    return true;
  }

  @Patch('/basic')
  async storeBasic(@Session() session: SessionData, @Body() body: IGenericObject) {
    const userId = session.user && session.user['uuid'];

    const orderService = new OrderService();

    const order = await orderService.store({
      ...body,
      userId,
    });

    await orderService.attachToModelById(order.uuid, userId, 'user');

    return order;
  }

  @Post()
  async store(@Session() session: SessionData, @Body() body: IGenericObject) {
    const cart = session.cart.toObject();

    if (!cart.items || !cart.items.length) {
      throw new RecordNotFoundException('No items in cart');
    }

    // The userId must be posted. This is a method for the admin, not the system users
    const userId = session.user && session.user['uuid'];

    const orderService = new OrderService();

    const [shippingAddressError, shippingAddress] = await handleAsync(
      new AddressService().findOne({
        uuid: body.shippingAddressId,
        type: 'SHIPPING',
        userId,
      }),
    );
    if (shippingAddressError) {
      throw new ShippingAddressNotFound();
    }

    const [billingAddressError, billingAddress] = await handleAsync(
      new AddressService().findOne({
        uuid: body.billingAddressId,
        type: 'BILLING',
        userId,
      }),
    );

    if (billingAddressError) {
      throw new BillingAddressNotFound();
    }

    const [errorCustomerPaymentMethod, customerPaymentMethod] = await handleAsync(
      new CustomerPaymentMethodService().findOne({
        uuid: body.customerPaymentMethodId,
      }),
    );

    if (errorCustomerPaymentMethod) {
      throw new CustomerPaymentMethodNotFound();
    }

    const [paymentMethodError, paymentMethod] = await handleAsync(
      new PaymentMethodService().findOne({
        uuid: customerPaymentMethod.paymentMethodId,
      }),
    );

    if (paymentMethodError) {
      throw new PaymentMethodNotFound();
    }

    const paymentProviderSettings = paymentMethod.providerSettings;

    const paymentProviderContainer = McmsDiContainer.get({
      id: `${
        paymentProviderSettings.providerName.charAt(0).toUpperCase() + paymentProviderSettings.providerName.slice(1)
      }Provider`,
    });

    const paymentMethodProvider: IPaymentMethodProvider = new paymentProviderContainer.reference();

    const [errorShippingMethod, shippingMethod] = await handleAsync(
      new ShippingMethodService().findOne({
        uuid: body.shippingMethodId,
      }),
    );

    if (errorShippingMethod) {
      throw new ShippingMethodNotFound();
    }

    const shippingProviderSettings = shippingMethod.providerSettings;

    const shippingProviderContainer = McmsDiContainer.get({
      id: `${
        shippingProviderSettings.providerName.charAt(0).toUpperCase() + shippingProviderSettings.providerName.slice(1)
      }Provider`,
    });

    const shippingMethodProvider: IShippingMethodProvider = new shippingProviderContainer.reference();

    const [shippingInfoError, shippingInfo] = await handleAsync(shippingMethodProvider.sendTransaction());
    if (shippingInfoError) {
      throw new ShippingMethodFaildTransaction();
    }

    const products = await new ProductService().find({
      uuids: cart.items.map((item) => item.productId),
    });

    const fullPrice = products.data.reduce(
      (accumulator, productItem: ProductModel) => (productItem.price ? accumulator + productItem.price : accumulator),
      0,
    );

    const [error, customer] = await handleAsync(
      new CustomerService().findOne({
        userId,
        provider: paymentProviderSettings.providerName,
      }),
    );

    if (error) {
      throw new CustomerNotFound();
    }

    const [errorPaymentInfo, paymentInfo] = await handleAsync(
      paymentMethodProvider.sendTransaction(
        customer.customerId,
        fullPrice,
        customerPaymentMethod.providerPaymentMethodId,
      ),
    );
    if (errorPaymentInfo) {
      throw new PaymentMethodFailedTransaction();
    }

    let rels = [
      {
        id: shippingAddress.uuid,
        name: 'address',
      },

      {
        id: billingAddress.uuid,
        name: 'address',
      },

      {
        id: paymentMethod.uuid,
        name: 'paymentMethod',
      },

      {
        id: shippingMethod.uuid,
        name: 'shippingMethod',
      },

      {
        id: userId,
        name: 'user',
      },
    ];

    products.data.forEach((productItem: ProductModel) => {
      rels = [
        ...rels,
        {
          id: productItem?.uuid,
          name: 'product',
        },
      ];
    });

    const [orderError, order] = await handleAsync(
      orderService.store(
        {
          status: 1,
          paymentMethod: paymentMethod.title,
          shippingMethod: shippingMethod.title,
          salesChannel: body.salesChannel,
          billingAddressId: billingAddress.uuid,
          shippingAddressId: shippingAddress.uuid,
          paymentStatus: 1,
          shippingStatus: 1,
          paymentInfo,
          shippingInfo,
          userId,
        },
        '',
        rels,
      ),
    );

    if (orderError) {
      throw new OrderFailed();
    }

    await session.cart.clearWithDb();

    return order;
  }

  @Delete(`:uuid`)
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user['uuid'];

    return await new OrderService().delete(uuid, userId);
  }

  @Patch(`:uuid`)
  async update(@Session() session: SessionData, @Body() body: IGenericObject, @Param('uuid') uuid: string) {
    const orderService = new OrderService();

    const orderItem = await orderService.findOne({ uuid });

    if (!orderItem) {
      throw new Error("Order doesn't exist");
    }

    const order = await orderService.update(uuid, {
      status: body.status,
    });

    return order;
  }
}
