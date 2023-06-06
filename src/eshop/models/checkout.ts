import { IGenericObject } from "~models/general";

export interface IStep {
  id: string;
  title: string;
  description: string;
  href: string;
  current: boolean;
  status: 'current' | 'upcoming' | 'complete';
  handler: boolean;
}

export interface IOrderMetaData {
  notes?: string;
  preferredDeliveryDate?: Date;
}

export interface IGuestContactInformation {
  email: string;
  phone: string;
}
export interface IPaymentMethod {
  surcharge: number;
  title: string;
  uuid: string;
  slug: string;
  status: boolean;
  providerName: string;
  paymentInformation?: IGenericObject;
  selectedShippingMethod?: IShippingMethod|null;
  shippingMethod: IShippingMethod[];
}
export interface IShippingMethod {
  code: string;
  shippingTime: string;
  title: string;
  uuid: string;
  slug: string;
  status: boolean;
  baseCost?: number;
}

export interface IAddress {
  zipcode: string;
  country: string;
  firstName: string;
  lastName: string;
  city: string;
  phone: string;
  street: string;
  region: string;
  postCode: string;
  default: boolean;
  type?: 'SHIPPING' | 'BILLING' | 'OTHER';
  uuid?: string;
}

export interface ICheckoutStore {
  shippingMethod: IShippingMethod;
  shippingInformation: IAddress;
  billingInformation: IAddress;
  contactInformation: IAddress|IGuestContactInformation;
  paymentMethod: IPaymentMethod;
  orderMetaData?: IOrderMetaData;
  useBillingInformation: boolean;
  notes?: string;
}
