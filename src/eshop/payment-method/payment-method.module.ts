import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";

import { PaymentMethodModel } from './models/payment-method.model';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentMethodService } from './services/payment-method.service';

@Module({
  imports: [
    SharedModule,
    PaymentMethodModule,
  ],
  providers: [
    PaymentMethodModel,
    PaymentMethodService,
  ],
  controllers: [PaymentMethodController]
})

export class PaymentMethodModule { }
