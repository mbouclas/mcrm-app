import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { CartService } from "~eshop/cart/cart.service";
import { CartController } from "~eshop/cart/cart.controller";
import { ConditionsService } from './conditions.service';
import { CouponService } from './coupon.service';
import { MoneyService } from './money.service';
import { ConditionService } from './condition.service';
import { CartModel } from "~eshop/models/Cart.model";
import * as process from "process";


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
export class CartModule {
  async onApplicationBootstrap() {
    setTimeout(async () => {
      if (process.env.ENV !== 'development' || process.env.RUN_TESTS_ON_BOOT !== 'true') {
        return;
      }

      const c = await import('./condition.spec');
      const conditionSpec = new c.ConditionSpec();
      await conditionSpec.runTests();
    }, 500)

  }
}
