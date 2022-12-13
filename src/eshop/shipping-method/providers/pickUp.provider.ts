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
      varName: 'deliveryInformation',
      label: 'DeliveryInformation',
      type: 'string',
    },

    {
      varName: 'description',
      label: 'Description',
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

  public sendTransaction() {
    return true;
  }
}
