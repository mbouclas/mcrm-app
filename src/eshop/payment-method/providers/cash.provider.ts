import {
  IPaymentMethodProvider,
  IPaymentMethodProviderConfig,
} from '~eshop/payment-method/models/providers.types';
import { IGenericObject } from '~models/general';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';
import { OnEvent } from '@nestjs/event-emitter';
import { store } from '~root/state';

export interface ICashProviderConfig extends IPaymentMethodProviderConfig {}

@McmsDi({
  id: 'CashProvider',
  type: 'class',
})
export class CashProvider implements IPaymentMethodProvider {
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
      type: 'stirng',
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
  public sendTransaction() {}
}
