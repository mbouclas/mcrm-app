import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";

import { OrderModel } from './models/order.model';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderMailEvents } from "~eshop/order/event-handlers/order.mail.events";
import { OrderListeners } from "~eshop/order/listeners/order.listeners";
import { InvoiceGeneratorService } from './services/invoice-generator.service';

@Module({
  imports: [
    SharedModule,
    OrderModule,
  ],
  providers: [
    OrderModel,
    OrderService,
    OrderMailEvents,
    OrderListeners,
    InvoiceGeneratorService,
  ],
  controllers: [OrderController]
})

export class OrderModule {}
