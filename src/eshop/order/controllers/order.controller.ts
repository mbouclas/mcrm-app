import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Session } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderEventNames, OrderService } from '~eshop/order/services/order.service';
import handleAsync from '~helpers/handleAsync';
import { SessionData } from 'express-session';
import { OrderNotFound } from "~eshop/exceptions";
import { Cart } from '~root/eshop/cart/Cart';
import { v4 } from 'uuid';

import BaseHttpException from "~shared/exceptions/base-http-exception";
import { InvoiceGeneratorService } from "~eshop/order/services/invoice-generator.service";
import { CartService } from "~eshop/cart/cart.service";


@Controller('api/order')
export class OrderController {
  constructor() {}

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
    const cartService = new CartService();

    const cart = new Cart(v4());

    for (const item of body.metaData.cart.items) {
      let cartItem = null;
      try {
        cartItem = await cartService.createCartItemFromProductId(
          item.productId,
          item.quantity,
          item.variantId,
          item.metaData,
          body.user.uuid,
        );
      } catch (e) {
        return { success: false, reason: 'ProductNotFound' };
      }

      try {
        cart.add(cartItem, item.overwriteQuantity || false);
      } catch (e) {
        return { success: false, reason: 'ProductNotFound' };
      }
    }

    await cart.save();
    await cart.attachCartToUser({ uuid: body.user.uuid });

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

    const [orderError, order] = await handleAsync(
      orderService.store(
        {
          total: OrderService.calculateTotalPrice(cart.items),
          metaData: { ...body.metaData, cart: cart.toObject() },
          shippingMethod: body.shippingMethod.uuid,
          paymentMethod: body.paymentMethod.uuid,
          status: body.status,
        },
        '',
        rels,
      ),
    );
    if (orderError) {
      return { success: false, message: 'FAILED_ORDER_CREATE', error: orderError.message };
    }

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
    const cartService = new CartService();

    const orderItem = await orderService.findOne({ uuid });

    if (!orderItem) {
      throw new Error("Order doesn't exist");
    }

    const cart = new Cart();
    await cart.initialize(body.metaData.cart.id, body.user.uuid);
    cart.clear();

    for (const item of body.metaData.cart.items) {
      let cartItem = null;
      try {
        cartItem = await cartService.createCartItemFromProductId(
          item.productId,
          item.quantity,
          item.variantId,
          item.metaData,
          body.user.uuid,
        );
      } catch (e) {
        return { success: false, reason: 'ProductNotFound' };
      }

      try {
        cart.add(cartItem, item.overwriteQuantity || false);
      } catch (e) {
        return { success: false, reason: 'ProductNotFound' };
      }
    }

    await cart.save();
    await cart.attachCartToUser({ uuid: body.user.uuid });

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

    const order = await orderService.update(
      uuid,
      {
        total: OrderService.calculateTotalPrice(cart.items),
        metaData: { ...body.metaData, cart: cart.toObject() },
        shippingMethod: body.shippingMethod.uuid,
        paymentMethod: body.paymentMethod.uuid,
        status: body.status,
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

  @Post(':uuid/pdf')
  async generatePdf(@Body() body: {regenerate: boolean}, @Param('uuid') uuid: string) {
    const service = new InvoiceGeneratorService();

    try {
      return await service.generate(uuid, body.regenerate || false);
    }
    catch (e) {
      throw new BaseHttpException({
        code: '1450.6',
        error: e,
        reason: e.message,
        statusCode: 500,
      })
    }

  }
}
