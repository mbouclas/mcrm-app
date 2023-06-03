import { PaymentMethodModel } from "~eshop/payment-method/models/payment-method.model";
import { ICart } from "~eshop/cart/cart.service";
import { UserModel } from "~user/models/user.model";
import { ICheckoutStore } from "~eshop/models/checkout";
export interface IBaseProviderSettings {
  method: PaymentMethodModel,
  cart?: ICart,
  order?: ICheckoutStore,
  user?: UserModel,
}

export class BasePaymentMethodProvider {
  constructor(
    protected settings: IBaseProviderSettings,
  ) {

  }
  async handle() {

  }
}
