import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { CartService } from "~eshop/cart/cart.service";
import { CartController } from "~eshop/cart/cart.controller";
import { ConditionsService } from './conditions.service';
import { CouponService } from './coupon.service';
import { MoneyService } from './money.service';
import { ConditionService } from './condition.service';
import { CartModel } from "~eshop/models/Cart.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    CartService,
    ConditionsService,
    CouponService,
    MoneyService,
    ConditionService,
    CartModel,
  ],
  controllers: [
    CartController,
  ],
})
export class CartModule {}
