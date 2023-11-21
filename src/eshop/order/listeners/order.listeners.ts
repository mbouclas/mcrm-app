import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { OrderEventNames } from "~eshop/order/services/order.service";
import { OrderModel } from "~eshop/order/models/order.model";


@Injectable()
export class OrderListeners {

  @OnEvent(OrderEventNames.orderStatusChanged)
  async orderStatusChanged({uuid, status}: {uuid: string, status: number}) {
    console.log('***** Order Listener', uuid, status);
  }

  @OnEvent(OrderEventNames.orderCreated)
  async onOrderCreated() {

  }

  @OnEvent(OrderEventNames.orderUpdated)
  async onOrderUpdated() {

  }

  @OnEvent(OrderEventNames.orderCancelled)
  async onOrderCanceled() {

  }

  @OnEvent(OrderEventNames.orderDeleted)
  async onOrderDeleted() {

  }

  @OnEvent(OrderEventNames.orderShipped)
  async onOrderShipped() {

  }

  @OnEvent(OrderEventNames.orderAttachedToNodes)
  async onOrderAttachedToNodes(order: OrderModel) {

  }

  @OnEvent(OrderEventNames.orderPaid)
  async onOrderPaid() {

  }
}
