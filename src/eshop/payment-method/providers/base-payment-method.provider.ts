import { PaymentMethodModel } from "~eshop/payment-method/models/payment-method.model";
import { ICart } from "~eshop/cart/cart.service";
import { UserModel } from "~user/models/user.model";
import { OrderModel } from "~eshop/order/models/order.model";
import { OrderService } from "~eshop/order/services/order.service";
import { InvalidOrderException } from "~eshop/order/exceptions/invalid-order.exception";
import { ZodObject } from "zod";

export interface IBasePaymentMethodProviderSettings {
  method: PaymentMethodModel,
  cart?: ICart,
  order?: OrderModel,
  user?: UserModel,
}

export class BasePaymentMethodProvider {
  static settingsSchema: ZodObject<any>;
  constructor(
    protected settings: IBasePaymentMethodProviderSettings
  ) {

  }

  async handle() {
    try {
      await this.attachToOrder();
    }
    catch (e) {
      throw new InvalidOrderException(e.message, '900.2', e as any);
    }

    return this;
  }

  async attachToOrder() {
    const service = new OrderService();
    let query = `
    MATCH (o:Order {uuid: $uuid})
    MATCH (pm:PaymentMethod {uuid: $paymentMethodUuid})
    MERGE (o)-[r:HAS_PAYMENT_METHOD]->(pm)
    ON CREATE SET r.updatedAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    return *;
    `;

    try {
      await service.neo.write(query, {
        uuid: this.settings.order.uuid,
        paymentMethodUuid: this.settings.method.uuid,
      });
    }
    catch (e)
    {
      console.log(`Error attaching payment method to order: ${e.message}`);
      throw new InvalidOrderException('FAILED_TO_ATTACH_PAYMENT_METHOD_TO_ORDER', '900.4');
    }

  }
}
