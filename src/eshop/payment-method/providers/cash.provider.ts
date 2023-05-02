import {
  IPaymentMethodProvider,
  IPaymentMethodProviderConfig,
} from '~eshop/payment-method/models/providers.types';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

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

  public async sendTransaction(email, price) {
    return JSON.stringify({
      provider: 'cash',
      price,
    });
  }

  public async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      return true;
    } catch (err) {
      return false;
    }
  }

  public async detachPaymentMethod(paymentMethodId) {
    try {
      return true;
    } catch (err) {
      return false;
    }
  }

  public async createCustomer(email) {
    try {
      return '';
    } catch (err) {
      console.log(err);
    }
  }

  public async deleteCustomer(customerId) {
    try {
      return true;
    } catch (err) {
      console.log(err);
    }
  }
}
