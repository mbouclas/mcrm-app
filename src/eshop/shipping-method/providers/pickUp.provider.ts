import {
  IShippingMethodProvider,
  IShippingMethodProviderConfig,
} from '~eshop/shipping-method/models/providers.types';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

export interface IPickUpProviderConfig extends IShippingMethodProviderConfig {}

@McmsDi({
  id: 'PickUpProvider',
  type: 'class',
})
export class PickUpProvider implements IShippingMethodProvider {
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

  constructor() {}

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
