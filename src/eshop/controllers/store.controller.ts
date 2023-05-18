import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { StoreInitialQueryInterceptor } from "~eshop/interceptors/store-initial-query.interceptor";
import { PaymentMethodService } from "~eshop/payment-method/services/payment-method.service";
import { IPagination } from "~models/general";
import { BaseModel } from "~models/base.model";
import { ShippingMethodService } from "~eshop/shipping-method/services/shipping-method.service";
import { store } from "~root/state";



export interface IStoreInitialQuery {
  paymentMethods: IPagination<BaseModel>;
  shippingMethods: IPagination<BaseModel>;
  config: any;
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
}
