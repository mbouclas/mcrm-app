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
import { CartService, ICart } from "~eshop/cart/cart.service";
import { ConditionService } from "~setting/condition/services/condition.service";
import { Condition, IConditionArgsConfig } from "~eshop/cart/Condition";
import { IAddress, IPaymentMethod, IShippingMethod } from "~eshop/models/checkout";
import { getHooks } from "~shared/hooks/hook.decorator";
import { UserService } from "~user/services/user.service";
import { RealIP } from "~helpers/real-ip.decorator";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import type { BasePaymentMethodProvider } from "~eshop/payment-method/providers/base-payment-method.provider";
import { capitalize } from "lodash";
import { BaseShippingMethodProvider } from "~eshop/shipping-method/providers/base-shipping-method.provider";
import { AddressService } from "~eshop/address/services/address.service";


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

  @Post('virtual-cart')
  async virtualCart(@Body() body: {cart: ICart, userId: string, shippingMethod: IShippingMethod}) {
    const cart = new Cart();
    await cart.initialize();
    const conditions = await new ConditionService().find({target: ['total', 'subtotal', 'numberOfItems'], active: true});

    for (const condition of conditions.data) {
      cart.condition(new Condition(condition as unknown as IConditionArgsConfig));
    }
    const cartService = new CartService();
    cart.clearCartConditionsByTarget('shipping');



    for (const item of body.cart.items) {
      try {
        const cartItem = await cartService.createCartItemFromProductId(
          item.productId,
          item.quantity,
          item.variantId,
          item.metaData,
          body.userId,
        )

        cart.add(cartItem);
      }
      catch (e) {
        console.log(e)
      }
    }

    if (!body.shippingMethod || !body.shippingMethod.baseCost || body.shippingMethod.baseCost === 0) {
      return cart.toObject();
    }

    cart.addCartCondition(new Condition({
      uuid: body.shippingMethod.uuid,
      title: body.shippingMethod.title,
      type: 'shipping',
      target: 'shipping',
      value: body.shippingMethod.baseCost.toString(),
      order: 999,
      attributes: {
        shippingMethod: body.shippingMethod.uuid,
        shippingTime: body.shippingMethod['shippingTime'],
        provider: body.shippingMethod['providerName'],
      }
    }));

    return cart.toObject()
  }

  @Post('custom-order')
  async customOrder(@Body() body: {metaData: {cart: ICart, billingInformation: IAddress, shippingInformation: IAddress}, userId: string,  paymentMethod: IPaymentMethod, shippingMethod: IShippingMethod}, @RealIP() ip: string) {
    const hooks = getHooks({ category: 'Order' });
    const userId = body.userId;
    const user = await new UserService().findOne({uuid: userId});
    let validatedOrder;

    try {
      if (hooks && typeof hooks.beforeOrderValidation === 'function') {
        await hooks.beforeOrderValidation(body, {}, ip, userId, user);
      }
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage() || e.message,
        reason: 'Validation errors',
        code: e.getCode() || 'BEFORE_ORDER_VALIDATION_HOOK_ERROR',
        statusCode: 500,
        validationErrors: e.getErrors() || e,
      })
    }


    try {
      const contactInformation = {...body.metaData.billingInformation, ...{email: user.email}};
      validatedOrder = await (new OrderService()).processStoreOrder({
        billingInformation: body.metaData.billingInformation,
        contactInformation,
        shippingInformation: body.metaData.shippingInformation,
        notes: body.metaData.cart?.metaData?.notes,
        paymentMethod: body.paymentMethod,
        shippingMethod: body.shippingMethod,
        orderMetaData: {
          notes: body.metaData.cart?.metaData?.notes,
        },
        useBillingInformation: false,
      });
    }
    catch (e) {
      console.log(e)
      return {success: false, message: 'Error processing order', error: e.message, errors: e, code: 'ORDER_PROCESSING_ERROR'};
    }


    const virtualCart = new Cart();
    for (const item of body.metaData.cart.items) {
      try {
        const cartItem = await new CartService().createCartItemFromProductId(
          item.productId,
          item.quantity,
          item.variantId,
          item.metaData,
          body.userId,
        )

        virtualCart.add(cartItem);
      }
      catch (e) {
        console.log(e)
      }
    }

    const cart = body.metaData.cart;
    virtualCart.items = await OrderService.validateCartItems(virtualCart.items);

    const orderService=  new OrderService();

    try {
      if (hooks && typeof hooks.beforeOrderSave === 'function') {
        await hooks.beforeOrderSave(cart, body, {}, ip, userId, user);
      }
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage() || e.message,
        reason: 'Validation errors',
        code: e.getCode() || 'BEFORE_ORDER_SAVE_HOOK_ERROR',
        statusCode: 500,
        validationErrors: e.getErrors() || e,
      })
    }

    const orderMetaData = {
      notes: body.metaData.cart?.metaData?.notes,
    };
    let order,
      orderModel = {
        userId,
        total: OrderService.calculateTotalPrice(cart.items),
        shippingMethod: body.shippingMethod.uuid,
        paymentMethod: body.paymentMethod.uuid,
        notes: body.metaData.cart?.metaData?.notes,
        addedByAdmin: true,
        metaData: {...orderMetaData, ...{ip, cart: virtualCart.toObject(), billingInformation: body.metaData.billingInformation, shippingInformation: body.metaData.shippingInformation}},
      };
    // Write the order first
    try {
      order = await orderService.store(orderModel, userId);
    }
    catch (e) {
      console.log(e)
    }

    try {
      if (hooks && typeof hooks.afterOrderSave === 'function') {
        await hooks.afterOrderSave(order, cart, body, {}, ip, userId, user);
      }
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage() || e.message,
        reason: 'Validation errors',
        code: e.getCode() || 'AFTER_ORDER_SAVE_HOOK_ERROR',
        statusCode: 500,
        validationErrors: e.getErrors() || e,
      })
    }

    try {
      await orderService.attachProductsToOrder(order.uuid, cart.items);
    }
    catch (e) {
      console.log('Error attaching products', e);
    }

    const {paymentMethod, shippingMethod} = validatedOrder;

    const paymentProviderContainer = McmsDiContainer.get<BasePaymentMethodProvider>({
      id: `${capitalize(paymentMethod.providerName)}Provider`,
    });

    const paymentMethodProvider: BasePaymentMethodProvider = new paymentProviderContainer.reference({
      method: paymentMethod,
      cart,
      order,
      user,
    }) as BasePaymentMethodProvider;

    try {
      await paymentMethodProvider.handle();
    }
    catch (e) {
      console.log(e)
      return {success: false, message: 'Error processing payment method', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }


    const shippingProviderContainer = McmsDiContainer.get({
      id: `${capitalize(shippingMethod.providerName)}Provider`,
    });

    const shippingMethodProvider: BaseShippingMethodProvider = new shippingProviderContainer.reference({
      method: shippingMethod,
      cart,
      order,
      user,
    });

    try {
      await shippingMethodProvider.handle();
    }
    catch (e) {
      console.log(e)
      return {success: false, message: 'Error processing shipping', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }

    try {
      let addressAttachmentResult = await orderService.attachAddressesToOrder(order.uuid, [{...body.metaData.billingInformation, ...{type: 'BILLING'}}, {...body.metaData.shippingInformation, ...{type: 'SHIPPING'}}]);
      if (addressAttachmentResult.unsavedAddresses.length > 0) {
        // Save the addresses
        const addressService = new OrderService(),
          fixedAddresses = []
        for (let idx = 0; addressAttachmentResult.unsavedAddresses.length > idx; idx++) {
          fixedAddresses.push(await (new AddressService()).attachAddressToUser(addressAttachmentResult.unsavedAddresses[idx], user.uuid, addressAttachmentResult.unsavedAddresses[idx].type));
        }
        // go again
        addressAttachmentResult = await orderService.attachAddressesToOrder(order.uuid, fixedAddresses);
      }
    }
    catch (e) {
      console.log('Error attaching products', e.message, e.getErrors());
      return {success: false, message: 'ERROR_ATTACHING_ADDRESS', error: e.message};
    }

    // Attach the order products to the user, create the HAS_BOUGHT relationship
    try {
      await (new OrderService()).attachOrderProductsToUser(order.uuid);
    }
    catch (e) {
      console.log('Error attaching products', e.message, e.getErrors());
      return {success: false, message: 'ERROR_ATTACHING_PRODUCTS', error: e.message};
    }

    (new OrderService).notify(OrderEventNames.orderAttachedToNodes, order);

    try {
      if (hooks && typeof hooks.afterDone === 'function') {
        await hooks.afterDone(order, cart, body, {}, ip, userId, user);
      }
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage() || e.message,
        reason: 'Validation errors',
        code: e.getCode() || 'AFTER_DONE_HOOK_ERROR',
        statusCode: 500,
        validationErrors: e.getErrors() || e,
      })
    }

    return {success: true, message: 'Order processed',  order: order.uuid};
  }
}
