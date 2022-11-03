import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { CustomerModule } from './customer/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CartModule } from './cart/cart.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';


@Module({
  imports: [OrderModule, CustomerModule, DashboardModule, PromotionsModule, CartModule, PaymentMethodModule],
  providers: [],
  controllers: []
})
export class EshopModule { }
