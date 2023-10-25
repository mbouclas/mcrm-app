import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { AddressModule } from './address/address.module';
import { CustomerModule } from './customer/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CartModule } from './cart/cart.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { ShippingMethodModule } from './shipping-method/shipping-method.module';
import { StoreController } from './controllers/store.controller';
import { QuoteProvider } from "~eshop/payment-method/providers/quote.provider";
import { CashProvider } from "~eshop/payment-method/providers/cash.provider";
import { StripeProvider } from "~eshop/payment-method/providers/stripe.provider";
import { CourierProvider } from "~eshop/shipping-method/providers/courier.provider";
import { PickUpProvider } from "~eshop/shipping-method/providers/pickUp.provider";
import { ElasticSearchService } from "~es/elastic-search.service";
import * as process from "process";
import { getStoreProperty } from "~root/state";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { RoleService } from "~user/role/services/role.service";
import { AttachGuestRoleToGuestTypeUsersPatch } from "~root/update/attach-guest-role-to-guest-type-users.patch";

@Module({
  imports: [
    OrderModule,
    CustomerModule,
    DashboardModule,
    PromotionsModule,
    CartModule,
    PaymentMethodModule,
    ShippingMethodModule,
    AddressModule,
  ],
  providers: [
    QuoteProvider,
    CashProvider,
    StripeProvider,
    CourierProvider,
    PickUpProvider,
    AttachGuestRoleToGuestTypeUsersPatch,
  ],
  controllers: [StoreController],
})
export class EshopModule {
async onApplicationBootstrap() {
    // Wait for everything to finish loading
    setTimeout(async () => {
      await EshopModule.checkIfAllElasticSearchIndexesArePresent();
      await EshopModule.checkForDefaultCustomerRole();
    }, 1000)

  }

  static async checkIfAllElasticSearchIndexesArePresent() {
    if (!getStoreProperty('configs.catalogue.elasticSearch.template')) {
      return;
    }

    const es = ElasticSearchService.newInstance();
    const indexExists = await es.indexExists(getStoreProperty('configs.catalogue.elasticSearch.index'));
    if (indexExists) {
      // console.log(`Index ${client.elasticSearch.index} already exists`);
      return;
    }

    await es.createIndex(process.env.ELASTICSEARCH_INDEX, getStoreProperty('configs.catalogue.elasticSearch.template'));

  }

  static async checkForDefaultCustomerRole() {

    const defaultRole = getStoreProperty('configs.store.users.newUserDefaultRole');

    const s = new RoleService();
    try {
      await s.findOne({name: defaultRole.name});
      return;
    }
    catch (e) {
      // record not found
    }

    try {
      await s.store(defaultRole);
    }
    catch (e) {
      console.log(e)
    }
  }
}
