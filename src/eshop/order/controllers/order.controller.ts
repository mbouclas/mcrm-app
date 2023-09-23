import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Session } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderEventNames, OrderService } from '~eshop/order/services/order.service';
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
  constructor() { }

  @Get()
  async find(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findAll(queryParams, rels);
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

  @Post()
  async store(@Body() body: IGenericObject) {
    const orderService = new OrderService();

    const rels = [];

    if (body.paymentMethod) {
      rels.push({
        id: body.paymentMethod.uuid,
        name: 'paymentMethod',
      });
    }

    if (body.shippingMethod) {
      rels.push({
        id: body.shippingMethod.uuid,
        name: 'shippingMethod',
      });
    }

    if (body.user) {
      rels.push({
        id: body.user.uuid,
        name: 'user',
      });
    }

    if (body.address) {
      for (const address of body.address) {
        for (const addressType of address.type) {
          rels.push({
            id: address.uuid,
            name: 'address',
            relationshipProps: {
              type: addressType,
            },
          });
        }
      }
    }

    const cart = body.metaData.cart;

    const [orderError, order] = await handleAsync(
      orderService.store(
        {
          status: 1,
          salesChannel: body.salesChannel,
          paymentStatus: 1,
          shippingStatus: 1,
        },
        '',
        rels,
      ),
    );

    try {
      await orderService.attachProductsToOrder(order.uuid, cart.items);
    } catch (e) {
      console.log('Error attaching products', e.getMessage(), e.getErrors());
    }

    // Attach the order products to the user, create the HAS_BOUGHT relationship
    try {
      await orderService.attachOrderProductsToUser(order.uuid);
    } catch (e) {
      console.log('Error attaching products', e.message, e.getErrors());
      return { success: false, message: 'ERROR_ATTACHING_PRODUCTS', error: e.message };
    }

    new OrderService().notify(OrderEventNames.orderAttachedToNodes, order);

    return order;
  }

  @Delete(`:uuid`)
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user['uuid'];

    return await new OrderService().delete(uuid, userId);
  }

  @Patch(`:uuid`)
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    const orderService = new OrderService();

    const orderItem = await orderService.findOne({ uuid });

    if (!orderItem) {
      throw new Error("Order doesn't exist");
    }

    const rels = [];

    if (body.paymentMethod) {
      rels.push({
        id: body.paymentMethod.uuid,
        name: 'paymentMethod',
      });
    }

    if (body.shippingMethod) {
      rels.push({
        id: body.shippingMethod.uuid,
        name: 'shippingMethod',
      });
    }

    if (body.address) {
      for (const address of body.address) {
        for (const addressType of address.type) {
          rels.push({
            id: address.uuid,
            name: 'address',
            relationshipProps: {
              type: addressType,
            },
          });
        }
      }
    }

    const cart = body.metaData.cart;

    const order = await orderService.update(
      uuid,
      {
        status: body.status,
        metaData: body.metaData,
      },
      null,
      rels,
      { clearExistingRelationships: true },
    );

    try {
      await orderService.attachProductsToOrder(order.uuid, cart.items);
    } catch (e) {
      console.log('Error attaching products', e.getMessage(), e.getErrors());
    }

    // Attach the order products to the user, create the HAS_BOUGHT relationship
    try {
      await orderService.attachOrderProductsToUser(order.uuid);
    } catch (e) {
      console.log('Error attaching products', e.message, e.getErrors());
      return { success: false, message: 'ERROR_ATTACHING_PRODUCTS', error: e.message };
    }

    new OrderService().notify(OrderEventNames.orderAttachedToNodes, order);

    return order;
  }

  @Patch(`:uuid/status`)
  async updateStatus(@Body() body: { status: number }, @Param('uuid') uuid: string) {
    const service = new OrderService();
    await service.update(uuid, { status: body.status });
    service.emit(OrderEventNames.orderStatusChanged, { uuid, status: body.status });
    return { success: true };
  }
}
