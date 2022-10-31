import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";

import { OrderModel } from './models/order.model';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

@Module({
  imports: [
    SharedModule,
    OrderModule,
  ],
  providers: [
    OrderModel,
    OrderService,
  ],
  controllers: [OrderController]
})

export class OrderModule {}
