# Status changes
2 classes responsible for status changes: OrderListeners & OrderMailEvents

### Events

```
export enum OrderEventNames {
  orderCreated = 'order.created',
  orderUpdated = 'order.updated',
  orderDeleted = 'order.deleted',
  orderStatusChanged = 'order.status.changed',
  orderPaymentStatusChanged = 'order.payment.status.changed',
  orderShippingStatusChanged = 'order.shipping.status.changed',
  orderCompleted = 'order.completed',
  orderCancelled = 'order.cancelled',
  orderShipped = 'order.shipped',
  orderPaid = 'order.paid',
  orderRefunded = 'order.refunded',
  orderPartiallyRefunded = 'order.partially.refunded',
  orderAttachedToNodes = 'order.attached.to.nodes',
}
```

Each of the 2 classes can be overridden. 

In the case of OrderMailEvents you can change the queue workers in the `store.notifications.email.workers` config. Make sure your class has a handle method. From that custom class you can load views or send emails anyway you like.

**Don't forget to register the new worker with the `client-code/client-orders.module`** or else it's not going to work

In the case of adding your custom listener for the order events in general, just add a new class that listens to the above event names and process as needed
