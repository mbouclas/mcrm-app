import { McmsDi } from "~helpers/mcms-component.decorator";
import { IShippingMethodProvider, IShippingMethodProviderConfig } from "~eshop/shipping-method/models/providers.types";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IPickUpProviderConfig } from "~eshop/shipping-method/providers/pickUp.provider";

@McmsDi({
  id: 'CourierProvider',
  type: 'class',
})
export class CourierProvider implements IShippingMethodProvider {
  protected config: IPickUpProviderConfig;
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
  public setConfig(config: IPickUpProviderConfig) {
    this.config = config;
    return this;
  }

  public getFields() {
    return this.settingsFields;
  }

  public getSettings() {}

  public async sendTransaction() {
    return JSON.stringify({
      status: 'SUCCESS',
    });
  }

}
