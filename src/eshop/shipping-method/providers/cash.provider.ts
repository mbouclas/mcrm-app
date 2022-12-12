import {
  IShippingMethodProvider,
  IShippingMethodProviderConfig,
} from '~eshop/shipping-method/models/providers.types';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

export interface ICashProviderConfig extends IShippingMethodProviderConfig {}

@McmsDi({
  id: 'CashProvider',
  type: 'class',
})
export class CashProvider implements IShippingMethodProvider {
  protected config: ICashProviderConfig;
  protected settingsFields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'displayName',
      label: 'DisplayName',
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

  public setConfig(config: ICashProviderConfig) {
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
