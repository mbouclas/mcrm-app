export interface IOrderCreatedEmailConfig {
  subject: string;
  template: string;
}
export interface IAdminEmailConfig {
  created: IOrderCreatedEmailConfig;
  updated: IOrderUpdatedEmailConfig;
  cancelled: IOrderCancelledEmailConfig;
}
export interface IOrderUpdatedEmailConfig {
  subject: string;
  template: string;
}
export interface IOrderCancelledEmailConfig {
  subject: string;
  template: string;
}
export interface IOrderConfig {
  admin: IAdminEmailConfig;
  customer: ICustomerConfig;
}
export interface ICustomerConfig {
  created: IOrderCreatedEmailConfig;
  updated: IOrderUpdatedEmailConfig;
  cancelled: IOrderCancelledEmailConfig;
}

export interface IEmailFromConfig {
  mail: string;
  name: string;
}

export interface IEmailConfigWorkers {
  admin: string;
  customer: string;
}

export interface IEmailConfig {
  workers: IEmailConfigWorkers;
  order: IOrderConfig;
  from: IEmailFromConfig;
  adminEmail: IEmailFromConfig;
  cc: IEmailFromConfig[];
  viewsDir: string;
}
export interface INotificationsConfig {
  email: IEmailConfig;
}
export interface IStoreConfig {
  notifications: INotificationsConfig;
}
