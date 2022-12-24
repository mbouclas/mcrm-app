export interface IPaymentMethodProviderConfig {}

export interface IPaymentMethodProvider {
  setConfig: (config: IPaymentMethodProviderConfig) => any;
  getFields: () => any;
  getSettings: () => any;
  sendTransaction: (email: string, price: number) => Promise<string>;
}
