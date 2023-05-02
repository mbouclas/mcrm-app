export interface IPaymentMethodProviderConfig {}

export interface IPaymentMethodProvider {
  setConfig: (config: IPaymentMethodProviderConfig) => any;
  getFields: () => any;
  getSettings: () => any;
  sendTransaction: (customerId: string, price: number) => Promise<string>;
  createCustomer: (email: string) => Promise<string>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  attachPaymentMethod: (
    paymentMethodId: string,
    customerId: string,
  ) => Promise<boolean>;
  detachPaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  getCardInfo: (paymentMethodId: string) => Promise<object>;
}
