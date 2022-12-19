export interface IPaymentMethodProviderConfig {}

export interface IPaymentMethodProvider {
  setConfig: (config: IPaymentMethodProviderConfig) => any;
  getFields: () => any;
  getSettings: () => any;
  sendTransaction: (price: number) => any;
}
