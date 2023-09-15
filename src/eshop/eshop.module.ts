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
  ],
  controllers: [StoreController],
})
export class EshopModule {
async onApplicationBootstrap() {
    // Wait for everything to finish loading
    setTimeout(async () => {
      await EshopModule.checkIfAllElasticSearchIndexesArePresent();
    }, 1000)

  }

  static async checkIfAllElasticSearchIndexesArePresent() {

    const es = ElasticSearchService.newInstance();
    const indexExists = await es.indexExists(process.env.ELASTICSEARCH_INDEX);
    if (indexExists) {
      // console.log(`Index ${client.elasticSearch.index} already exists`);
      return;
    }

    await es.createIndex(process.env.ELASTICSEARCH_INDEX, getStoreProperty('catalogue.elasticSearch.template'));

  }
}
