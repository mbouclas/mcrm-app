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

  public async sendTransaction(customerId, price, paymentMethodId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: price * 100 || 50,
        currency: 'eur',
        setup_future_usage: 'off_session',
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
      });

      return JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        customerId,
        price,
        status: 'PENDING',
      });
    } catch (err) {
      console.log(err);
    }
  }

  public async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return true;
    } catch (err) {
      return false;
    }
  }

  public async detachPaymentMethod(paymentMethodId) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      return true;
    } catch (err) {
      return false;
    }
  }

  public async createCustomer(email) {
    try {
      const customer = await this.stripe.customers.create({
        email,
      });

      return customer.id;
    } catch (err) {
      console.log(err);
    }
  }

  public async deleteCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.del(customerId);

      return true;
    } catch (err) {
      console.log(err);
    }
  }

  public async getCardInfo(paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        paymentMethodId,
      );

      return paymentMethod;
    } catch (err) {
      console.log(err);
    }
  }
}
