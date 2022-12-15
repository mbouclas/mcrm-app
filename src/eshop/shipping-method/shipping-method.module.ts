import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';

import { ShippingMethodModel } from './models/shipping-method.model';
import { ShippingMethodController } from './controllers/shipping-method.controller';
import { ShippingMethodService } from './services/shipping-method.service';
import { PickUpProvider } from '~eshop/shipping-method/providers/pickUp.provider';

@Module({
  imports: [SharedModule, ShippingMethodModule],
  providers: [ShippingMethodModel, ShippingMethodService, PickUpProvider],
  controllers: [ShippingMethodController],
})
export class ShippingMethodModule {}
