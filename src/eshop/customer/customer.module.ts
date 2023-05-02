import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';

import { CustomerModel } from './models/customer.model';
import { CustomerPaymentMethodModel } from './models/customer-payment-method.model';
import { CustomerPaymentMethodController } from './controllers/customer-payment-method.controller';
import { CustomerService } from './services/customer.service';
import { CustomerPaymentMethodService } from './services/customer-payment-method.service';

@Module({
  imports: [SharedModule],
  providers: [
    CustomerModel,
    CustomerPaymentMethodModel,
    CustomerService,
    CustomerPaymentMethodService,
  ],
  controllers: [CustomerPaymentMethodController],
})
export class CustomerModule {}
