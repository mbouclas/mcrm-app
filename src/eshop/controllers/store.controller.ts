import { Body, Controller, Get, Post, Session, UseInterceptors } from "@nestjs/common";
import { StoreInitialQueryInterceptor } from "~eshop/interceptors/store-initial-query.interceptor";
import { PaymentMethodService } from "~eshop/payment-method/services/payment-method.service";
import {  IPagination } from "~models/general";
import { BaseModel } from "~models/base.model";
import { ShippingMethodService } from "~eshop/shipping-method/services/shipping-method.service";
import { store } from "~root/state";
import { SessionData } from "express-session";
import { OrderEventNames, OrderService } from "~eshop/order/services/order.service";
import { ICheckoutStore } from "~eshop/models/checkout";
import { ProductService } from "~catalogue/product/services/product.service";
import { ProductModel } from "~catalogue/product/models/product.model";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { capitalize } from "lodash";
import type { BasePaymentMethodProvider } from "~eshop/payment-method/providers/base-payment-method.provider";
import { BaseShippingMethodProvider } from "~eshop/shipping-method/providers/base-shipping-method.provider";
import { AddressService } from "~eshop/address/services/address.service";
import { SharedModule } from "~shared/shared.module";
import { CartService } from "~eshop/cart/cart.service";
import { OrderModel } from "~eshop/order/models/order.model";


export interface IStoreInitialQuery {
  paymentMethods: IPagination<BaseModel>;
  shippingMethods: IPagination<BaseModel>;
  config: any;
}

export interface ICheckUserEmailResult {
  email: string;
  type?: 'guest'|'user';
  exists: boolean;
  error?: string;
  reason?: string;
}


@Controller('store')
export class StoreController {
  // Initial query. Returns all the data needed to render the store
  @Get('get')
  @UseInterceptors(StoreInitialQueryInterceptor)
  async get(): Promise<IStoreInitialQuery> {
    const config = store.getState().configs.store;
    const paymentMethods = await new PaymentMethodService().find({ where: { status: true }}, ['shippingMethod']);
    const shippingMethods = await new ShippingMethodService().find();
    return {
      paymentMethods,
      shippingMethods,
      config
    }
  }

  @Post('order')
  async newOrder(@Session() session: SessionData, @Body() body: ICheckoutStore) {
    if (!session.cart) {
      return {success: false, message: 'Cart is empty', error: 'CART_EMPTY'};
    }

    if (session.cart.items.length === 0) {
      return {success: false, message: 'Cart is empty', error: 'CART_EMPTY'};
    }

    if (!session.user || !session.user['uuid']) {
      return {success: false, message: 'User not set', error: 'USER_NOT_SET'};
    }


    let userId = session.user.uuid,
      user = session.user,
    validatedOrder;

    try {
      validatedOrder = await (new OrderService()).processStoreOrder(body);
    }
    catch (e) {
      return {success: false, message: 'Error processing order', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }

    const cart = session.cart;

    // validate cartItems against products
    cart.items = await OrderService.validateCartItems(cart.items);

    const orderService=  new OrderService();

    let order,
      orderModel = {
        userId,
        total: OrderService.calculateTotalPrice(cart.items),
        shippingMethod: body.shippingMethod.uuid,
        paymentMethod: body.paymentMethod.uuid,
        notes: body.notes,
        metaData: body.orderMetaData,
      };
    // Write the order first
    try {
      order = await orderService.store(orderModel, userId);
    }
    catch (e) {
      console.log(e)
    }

    // Attach the products
    try {
      await orderService.attachProductsToOrder(order.uuid, cart.items);
    }
    catch (e) {
      console.log('Error attaching products', e.getMessage(), e.getErrors());
    }
    // Attach the payment method
    // Attach the shipping method

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

    // Attach the addresses to the order
    try {
      const addressAttachmentResult = await orderService.attachAddressesToOrder(order.uuid, [{...body.billingInformation, ...{type: 'BILLING'}}, {...body.shippingInformation, ...{type: 'SHIPPING'}}]);
      if (addressAttachmentResult.unsavedAddresses.length > 0) {
        // Save the addresses
        const addressService = new OrderService(),
        fixedAddresses = []
        for (let idx = 0; addressAttachmentResult.unsavedAddresses.length > idx; idx++) {
          fixedAddresses.push(await (new AddressService()).attachAddressToUser(addressAttachmentResult.unsavedAddresses[idx], session.user.uuid, addressAttachmentResult.unsavedAddresses[idx].type));
        }
        // go again
        await orderService.attachAddressesToOrder(order.uuid, fixedAddresses);
      }
    }
    catch (e) {
      console.log('Error attaching products', e.message, e.getErrors());
      return {success: false, message: 'ERROR_ATTACHING_ADDRESS', error: e.message};
    }

    // Attach the cart to the order
    try {
      await (new CartService()).attachModelToCart(OrderModel, {uuid: order.uuid}, cart.id);
    }
    catch (e) {
      console.log('Error attaching cart', e.message, e);
      return {success: false, message: 'ERROR_ATTACHING_CART', error: e.message};
    }

    (new OrderService).notify(OrderEventNames.orderAttachedToNodes, order);

    return {success: true, message: 'Order processed',  order: order.uuid};
  }
}
