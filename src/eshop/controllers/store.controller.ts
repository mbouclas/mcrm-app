import { Body, Controller, Get, Post, Session, UseInterceptors } from "@nestjs/common";
import { StoreInitialQueryInterceptor } from "~eshop/interceptors/store-initial-query.interceptor";
import { PaymentMethodService } from "~eshop/payment-method/services/payment-method.service";
import {  IPagination } from "~models/general";
import { BaseModel } from "~models/base.model";
import { ShippingMethodService } from "~eshop/shipping-method/services/shipping-method.service";
import { store } from "~root/state";
import { SessionData } from "express-session";
import { OrderService } from "~eshop/order/services/order.service";
import { ICheckoutStore } from "~eshop/models/checkout";
import { ProductService } from "~catalogue/product/services/product.service";
import { ProductModel } from "~catalogue/product/models/product.model";
import { IPaymentMethodProvider } from "~eshop/payment-method/models/providers.types";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { capitalize } from "lodash";
import type { BasePaymentMethodProvider } from "~eshop/payment-method/providers/base-payment-method.provider";


export interface IStoreInitialQuery {
  paymentMethods: IPagination<BaseModel>;
  shippingMethods: IPagination<BaseModel>;
  config: any;
}

export interface ICheckUserEmailResult {
  email: string;
  type?: 'guest'|'user';
  exists: boolean;
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

    let userId,
      user = {email: 'mbouclas@gmail.com'},
    validatedOrder;

/*    if (!session.user || !session.user['uuid']) {
      return {success: false, message: 'User not found', error: 'USER_NOT_FOUND'};
    }*/
    try {
      validatedOrder = await (new OrderService()).processStoreOrder(body);
    }
    catch (e) {
      return {success: false, message: 'Error processing order', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }

    const cart = session.cart;
    const products = await new ProductService().find({
      uuids: cart.items.map((item) => item.productId),
    });

    let fullPrice = products.data.reduce(
      (accumulator, productItem: ProductModel) => (productItem.price ? accumulator + productItem.price : accumulator),
      0,
    );

    const {paymentMethod, shippingMethod} = validatedOrder;

    const paymentProviderContainer = McmsDiContainer.get<BasePaymentMethodProvider>({
      id: `${capitalize(paymentMethod.providerName)}Provider`,
    });

    const paymentMethodProvider: BasePaymentMethodProvider = new paymentProviderContainer.reference({
      paymentMethod,
      cart,
      order: body,
      user
    }) as BasePaymentMethodProvider;

    try {
      await paymentMethodProvider.handle();
    }
    catch (e) {
      console.log(e)
      return {success: false, message: 'Error processing payment', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }


    const shippingProviderContainer = McmsDiContainer.get({
      id: `${capitalize(shippingMethod.providerName)}Provider`,
    });


/*    orderService.store(
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
    ),*/

    return {success: true, message: 'Order processed',  cart: cart.count(), fullPrice};
  }
}
