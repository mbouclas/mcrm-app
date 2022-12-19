import {
  IPaymentMethodProvider,
  IPaymentMethodProviderConfig,
} from '~eshop/payment-method/models/providers.types';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import Stripe from 'stripe';

export interface IStripeProviderConfig extends IPaymentMethodProviderConfig {}

@McmsDi({
  id: 'StripeProvider',
  type: 'class',
})
export class StripeProvider implements IPaymentMethodProvider {
  protected stripe: Stripe;
  protected config: IStripeProviderConfig;
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

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_API_SECRET, {
      apiVersion: '2022-11-15',
    });
  }

  public setConfig(config: IStripeProviderConfig) {
    this.config = config;
    return this;
  }

  public getFields() {
    return this.settingsFields;
  }

  public getSettings() {}

  public async sendTransaction(amount) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount || 50,
      currency: 'eur',
      setup_future_usage: 'off_session',
    });

    return paymentIntent.client_secret;
  }
}
