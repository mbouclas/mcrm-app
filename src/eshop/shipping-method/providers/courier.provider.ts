import { McmsDi } from "~helpers/mcms-component.decorator";

import {
  BaseShippingMethodProvider,
  IBaseShippingMethodProviderSettings
} from "~eshop/shipping-method/providers/base-shipping-method.provider";
export interface ICourierProviderConfig extends IBaseShippingMethodProviderSettings {

}
@McmsDi({
  id: 'CourierProvider',
  type: 'class',
})
export class CourierProvider extends BaseShippingMethodProvider{
  protected config: ICourierProviderConfig;



}
