import { Module } from '@nestjs/common';
import { CheckoutSettingsController } from './checkout-settings.controller';

@Module({
  controllers: [CheckoutSettingsController]
})
export class PublicModule {}
