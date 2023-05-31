import { IPaymentMethodProvider, IPaymentMethodProviderConfig } from "~eshop/payment-method/models/providers.types";
import { McmsDi } from "~helpers/mcms-component.decorator";

@McmsDi({
  id: 'QuoteProvider',
  type: 'class',
})
export class QuoteProvider implements IPaymentMethodProvider {
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  createCustomer(email: string): Promise<string> {
    return Promise.resolve("");
  }

  deleteCustomer(customerId: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  getCardInfo(paymentMethodId: string): Promise<object> {
    return Promise.resolve(undefined);
  }

  getFields(): any {
  }

  getSettings(): any {
  }

  sendTransaction(customerId: string, price: number, paymentMethodId: string): Promise<string> {
    return Promise.resolve("");
  }

  setConfig(config: IPaymentMethodProviderConfig): any {
  }

}
