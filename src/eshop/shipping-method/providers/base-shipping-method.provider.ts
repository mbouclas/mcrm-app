import { ICart } from "~eshop/cart/cart.service";
import { OrderModel } from "~eshop/order/models/order.model";
import { UserModel } from "~user/models/user.model";
import { ShippingMethodModel } from "~eshop/shipping-method/models/shipping-method.model";
import { OrderService } from "~eshop/order/services/order.service";
import { InvalidOrderException } from "~eshop/order/exceptions/invalid-order.exception";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IPickUpProviderConfig } from "~eshop/shipping-method/providers/pickUp.provider";

export interface IBaseShippingMethodProviderSettings {
  method: ShippingMethodModel,
  cart?: ICart,
  order?: OrderModel,
  user?: UserModel,
}

export class BaseShippingMethodProvider {
  protected config: IBaseShippingMethodProviderSettings;
  protected settingsFields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'description',
      label: 'Description',
      type: 'string',
    },
    {
      varName: 'deliveryTime',
      label: 'DeliveryTime',
      type: 'string',
    },
    {
      varName: 'trackingUrl',
      label: 'TrackingUrl',
      type: 'string',
    },
  ];

  constructor(
    protected settings: IBaseShippingMethodProviderSettings
  ) {

  }

  public setConfig(config: IBaseShippingMethodProviderSettings) {
    this.config = config;
    return this;
  }

  public getFields() {
    return this.settingsFields;
  }

  public getSettings() {}


  async handle() {

    try {
      await this.attachToOrder();
    }
    catch (e) {
      console.log(`Error attaching shipping method to order: ${e.message}`);
      throw new InvalidOrderException('FAILED_TO_ATTACH_SHIPPING_METHOD_TO_ORDER', '900.5');
    }

    return this;
  }


  async attachToOrder() {
    const service = new OrderService();
    let query = `
    MATCH (o:Order {uuid: $uuid})
    MATCH (pm:ShippingMethod {uuid: $shippingMethodUuid})
    MERGE (o)-[r:HAS_SHIPPING_METHOD]->(pm)
    ON CREATE SET r.updatedAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    return *;
    `;

    try {
      await service.neo.write(query, {
        uuid: this.settings.order.uuid,
        shippingMethodUuid: this.settings.method.uuid,
      });
    }
    catch (e)
    {
      console.log(`Error attaching shipping method to order: ${e.message}`);
      throw new InvalidOrderException('FAILED_TO_ATTACH_SHIPPING_METHOD_TO_ORDER', '900.5');
    }

  }
}
