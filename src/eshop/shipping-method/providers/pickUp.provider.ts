import {
  IShippingMethodProvider,
  IShippingMethodProviderConfig,
} from '~eshop/shipping-method/models/providers.types';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import {
  BaseShippingMethodProvider,
  IBaseShippingMethodProviderSettings
} from "~eshop/shipping-method/providers/base-shipping-method.provider";

export interface IPickUpProviderConfig extends IBaseShippingMethodProviderSettings {}

@McmsDi({
  id: 'PickUpProvider',
  type: 'class',
})
export class PickUpProvider extends BaseShippingMethodProvider {
  protected config: IPickUpProviderConfig;
}
