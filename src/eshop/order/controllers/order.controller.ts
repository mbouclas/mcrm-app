import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderService } from '~eshop/order/services/order.service';
import { AddressService } from '~eshop/address/services/address.service';
import { ProductService } from '~root/catalogue/product/services/product.service';
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

@Controller('api/order')
export class OrderController {
  constructor() { }

  @Get()
  async find(@Session() session: SessionData, @Query() queryParams = {}) {
    const userId = session.user && session.user.user['uuid'];
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findAll({ userId }, rels);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findOne({ uuid }, rels);
  }

  @Post('/webhooks')
  async webhook(@Body() body: IGenericObject) {
    if (body.type === 'payment_intent.succeeded') {
      let clientSecret = body.data.client_secret;

      // clientSecret = 'pi_3MMaBpFVnCuD42ua2CDyjXPL_secret_BwHVPZzQYElqvG9LZgwjdHSCj';

      const order = await new OrderService().findByRegex(
        'paymentInfo',
        clientSecret,
      );

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

  @Post()
  async store(@Session() session: SessionData, @Body() body: IGenericObject) {
    const cart = session.cart.toObject();

    if (!cart.items || !cart.items.length) {
      throw new RecordNotFoundException('No items in cart');
    }

    const userId = session.user && session.user.user['uuid'];

    const orderService = new OrderService();

    let shippingAddress;
    let billingAddress;

    if (!body.shippingAddressId) {
      shippingAddress = await new AddressService().store({
        city: body.newShippingAddress.city,
        country: body.newShippingAddress.country,
        zipcode: body.newShippingAddress.zipcode,
        street: body.newShippingAddress.street,
        note: body.newShippingAddress.note,
        type: 'SHIPPING',
        userId,
      });
    } else {
      shippingAddress = await new AddressService().findOne({
        uuid: body.shippingAddressId,
        type: 'SHIPPING',
      });
    }

    if (!body.billingAddressId) {
      billingAddress = await new AddressService().store({
        city: body.newBillingAddress.city,
        country: body.newBillingAddress.country,
        zipcode: body.newBillingAddress.zipcode,
        street: body.newBillingAddress.street,
        note: body.newBillingAddress.note,
        type: 'BILLING',
        userId,
      });
    } else {
      billingAddress = await new AddressService().findOne({
        uuid: body.billingAddressId,
        type: 'BILLING',
      });
    }
    if (!billingAddress || !shippingAddress) {
      throw new Error('Billing and shipping address required');
    }

    const paymentMethod = await new PaymentMethodService().findOne({
      uuid: body.paymentMethodId,
    });

    const pamentProviderSettings = paymentMethod.providerSettings;

    const paymentProviderContainer = McmsDiContainer.get({
      id: `${pamentProviderSettings.providerName.charAt(0).toUpperCase() +
        pamentProviderSettings.providerName.slice(1)
        }Provider`,
    });

    const paymentMethodProvider: IPaymentMethodProvider =
      new paymentProviderContainer.reference();

    const shippingMethod = await new ShippingMethodService().findOne({
      uuid: body.shippingMethodId,
    });

    const shippingProviderSettings = shippingMethod.providerSettings;

    const shippingProviderContainer = McmsDiContainer.get({
      id: `${shippingProviderSettings.providerName.charAt(0).toUpperCase() +
        shippingProviderSettings.providerName.slice(1)
        }Provider`,
    });

    const shippingMethodProvider: IShippingMethodProvider =
      new shippingProviderContainer.reference();

    const shippingInfo = await shippingMethodProvider.sendTransaction();

    const products = await new ProductService().find({
      uuids: cart.items.map((item) => item.productId),
    });

    let fullPrice = products.data.reduce(
      (accumulator, productItem: ProductModel) =>
        productItem.price ? accumulator + productItem.price : accumulator,
      0,
    );

    const paymentInfo = await paymentMethodProvider.sendTransaction(
      session.user.user.email,
      fullPrice,
    );

    const order = await orderService.store({
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
    });

    await orderService.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['Address'],
      {
        uuid: shippingAddress.uuid,
      },
      'address',
    );

    await orderService.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['Address'],
      {
        uuid: billingAddress.uuid,
      },
      'address',
    );

    await orderService.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['PaymentMethod'],
      {
        uuid: paymentMethod.uuid,
      },
      'paymentMethod',
    );

    await orderService.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['ShippingMethod'],
      {
        uuid: shippingMethod.uuid,
      },
      'shippingMethod',
    );

    await orderService.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['User'],
      {
        uuid: userId,
      },
      'user',
    );

    await Promise.all(
      products.data.map(async (productItem: ProductModel) => {
        await orderService.attachModelToAnotherModel(
          store.getState().models['Order'],
          {
            uuid: order.uuid,
          },
          store.getState().models['Product'],
          {
            uuid: productItem?.uuid,
          },
          'product',
          {
            quantity: cart.items.find((item) => item.productId === productItem.uuid)
              .quantity,
          },
        );
      }),
    );

    await session.cart.clearWithDb();

    return order;
  }

  @Delete(`:uuid`)
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user.user['uuid'];

    return await new OrderService().delete(uuid, userId);
  }


  @Post(`:uuid`)
  async update(@Session() session: SessionData, @Body() body: IGenericObject, @Param('uuid') uuid: string) {

    const userId = session.user && session.user.user['uuid'];

    const orderService = new OrderService();

    const orderItem = await orderService.findOne({ uuid });

    if (!orderItem) {
      throw new Error("Order doesn't exist");
    }

    const paymentMethodBody = body.paymentMethod[0];
    const paymentMethod = await new PaymentMethodService().update(paymentMethodBody.uuid, paymentMethodBody);

    const shippingMethodBody = body.shippingMethod[0];
    const shippingMethod = await new ShippingMethodService().update(shippingMethodBody.uuid, shippingMethodBody);


    const shippingAdressBody = body.address.find(address => address.type === 'SHIPPING');
    const shippingAddress = await new AddressService().update(shippingAdressBody.uuid, shippingAdressBody);


    const billingAdressBody = body.address.find(address => address.type === 'BILLING');
    const billingAddress = await new AddressService().update(billingAdressBody.uuid,
      billingAdressBody);



    const order = await orderService.update(uuid, {
      status: 1,
      paymentMethod: paymentMethod.title,
      shippingMethod: shippingMethod.title,
      salesChannel: body.salesChannel,
      billingAddressId: billingAddress.uuid,
      shippingAddressId: shippingAddress.uuid,
      paymentStatus: 1,
      shippingStatus: 1,
      shippingInfo: body.shippingInfo,
      VAT: body.VAT,
      total: body.total,
      userId,
    });

    return order;
  }
}
