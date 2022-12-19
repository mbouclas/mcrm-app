import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';
import { PaymentMethodModel } from './models/payment-method.model';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentMethodService } from './services/payment-method.service';
import { CashProvider } from '~eshop/payment-method/providers/cash.provider';
import { StripeProvider } from '~eshop/payment-method/providers/stripe.provider';

@Module({
  imports: [SharedModule, PaymentMethodModule],
  providers: [
    PaymentMethodModel,
    PaymentMethodService,
    CashProvider,
    StripeProvider,
  ],
  controllers: [PaymentMethodController],
})
export class PaymentMethodModule {}
