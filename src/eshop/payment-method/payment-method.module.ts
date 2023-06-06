import { Logger, Module } from "@nestjs/common";
import { SharedModule } from '~shared/shared.module';
import { PaymentMethodModel } from './models/payment-method.model';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentMethodService } from './services/payment-method.service';
import { CashProvider } from '~eshop/payment-method/providers/cash.provider';
import { StripeProvider } from '~eshop/payment-method/providers/stripe.provider';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ModuleRef } from "@nestjs/core";

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
export class PaymentMethodModule {
  static eventEmitter: EventEmitter2;
  static moduleRef: ModuleRef;
  private readonly logger = new Logger(PaymentMethodModule.name);

  constructor(
    private m: ModuleRef,
    private eventEmitter: EventEmitter2,
  ) {
    PaymentMethodModule.eventEmitter = eventEmitter;

  }

  onModuleInit() {
    PaymentMethodModule.moduleRef = this.m;
    this.logger.log(`${PaymentMethodModule.name} initialized`);
  }
}
