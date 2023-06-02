import { Body, Controller, Get, Post, Session, UseInterceptors } from "@nestjs/common";
import { StoreInitialQueryInterceptor } from "~eshop/interceptors/store-initial-query.interceptor";
import { PaymentMethodService } from "~eshop/payment-method/services/payment-method.service";
import { IGenericObject, IPagination } from "~models/general";
import { BaseModel } from "~models/base.model";
import { ShippingMethodService } from "~eshop/shipping-method/services/shipping-method.service";
import { store } from "~root/state";
import { UserService } from "~user/services/user.service";
import { SessionData } from "express-session";
import { SessionRetrieverInterceptor } from "~root/auth/interceptors/session-retriever.interceptor";
import { OrderService } from "~eshop/order/services/order.service";
import { AddressService } from "~eshop/address/services/address.service";
import { ICheckoutStore } from "~eshop/models/checkout";
import { InvalidOrderException } from "~eshop/order/exceptions/invalid-order.exception";



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
    let userId,
    processedOrder;

/*    if (!session.user || !session.user['uuid']) {
      return {success: false, message: 'User not found', error: 'USER_NOT_FOUND'};
    }*/
    try {
      processedOrder = await (new OrderService()).processStoreOrder(body);
    }
    catch (e) {

      return {success: false, message: 'Error processing order', error: e.getMessage(), errors: e.getErrors(), code: e.getCode()};
    }

    return {success: true, message: 'Order processed', order: processedOrder};
    // userId = session.user.id;

    /*let shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod;

    const orderService = new OrderService();

    const addressService = new AddressService();

    try {
     shippingAddress = await addressService.findOne({
        uuid: body.shippingAddressId,
      });
    } catch (e) {
      return {success: false, message: 'Shipping address not found', error: 'SHIPPING_ADDRESS_NOT_FOUND'};
    }

    try {
      billingAddress = addressService.findOne({
        uuid: body.billingAddressId,
      })
    }
    catch (e) {
      return {success: false, message: 'Billing address not found', error: 'BILLING_ADDRESS_NOT_FOUND'};
    }

    try {
      paymentMethod = await new PaymentMethodService().findOne({
        uuid: body.paymentMethodId,
      });
    }
    catch (e) {
      return {success: false, message: 'Payment method not found', error: 'PAYMENT_METHOD_NOT_FOUND'};
    }

    try {
      shippingMethod = await new ShippingMethodService().findOne({
       uuid: body.shippingMethodId,
      });
    }
    catch (e) {
      return {success: false, message: 'Shipping method not found', error: 'SHIPPING_METHOD_NOT_FOUND'};
    }

    return {body};*/
  }
}
