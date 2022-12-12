export interface IShippingMethodProviderConfig {}

export interface IShippingMethodProvider {
  setConfig: (config: IShippingMethodProviderConfig) => any;
  getFields: () => any;
  getSettings: () => any;
  sendTransaction: () => any;
}
