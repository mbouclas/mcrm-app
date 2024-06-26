import { Injectable, OnModuleInit } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { OrderEventNames, OrderService } from "~eshop/order/services/order.service";
import { OrderModel } from "~eshop/order/models/order.model";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { Job, Queue } from "bullmq";
import { getStoreProperty } from "~root/state";
import { IEmailConfig } from "~eshop/models/config.model";
import { MailService } from "~root/mail/services/mail.service";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { maizzleRenderer } from "~helpers/maizzle.renderer";
import { sprintf } from "sprintf-js";

export enum MailTypes {
  orderCreated = 'orderCreated',
  orderUpdated = 'orderUpdated',
  orderCancelled = 'orderCancelled',
  orderDeleted = 'orderDeleted',
  orderShipped = 'orderShipped',
  orderAttachedToNodes = 'orderAttachedToNodes',
  orderPaid = 'orderPaid',
  orderStatusChanged = 'orderStatusChanged',
}

export interface IMailJob {
  type: MailTypes;
  order: OrderModel;
  uuid: string;
}

@Injectable()
export class OrderMailEvents implements OnModuleInit {
  public static customerQueueName = `${MailQueueEventNames.default}:customer`;
  public static adminQueueName = `${MailQueueEventNames.default}:admin`;
  public static adminQueue: Queue;
  public static customerQueue: Queue;
  protected static config: IEmailConfig;
  protected handlers = {
    orderStatusChanged: this.orderStatusChangedHandler,
    orderAttachedToNodes: this.orderAttachedToNodesHandler,
    orderCreated: this.orderCreatedHandler,
  };

  async onModuleInit() {
    OrderMailEvents.customerQueue = new Queue(OrderMailEvents.customerQueueName, {
      connection: MailQueueService.redisConnection
    });

    OrderMailEvents.adminQueue = new Queue(OrderMailEvents.adminQueueName, {
      connection: MailQueueService.redisConnection
    });

    OrderMailEvents.customerQueue.on('waiting', (job) => console.log(`${OrderMailEvents.customerQueueName}: ${job.id}  now waiting`));
    OrderMailEvents.adminQueue.on('waiting', (job) => console.log(`${OrderMailEvents.adminQueueName}: ${job.id}  now waiting`));

    // MailQueueService.addWorker(this.customerMailProcessor, OrderMailEvents.customerQueueName);
    // MailQueueService.addWorker(this.adminMailProcessor, OrderMailEvents.adminQueueName);
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    OrderMailEvents.config = getStoreProperty('configs.store.notifications.email');
/*    try {
      const order = await (new OrderService()).findOne({orderId: 'LDXI0EJE'}, ['*']);
      await (new OrderMailEvents()).onOrderAttachedToNodes(order);
    }
    catch (e) {
      console.log(e)
    }*/

    let adminWorker = this.adminMailProcessor;
    let customerWorker = this.customerMailProcessor;

    if (OrderMailEvents.config.workers && OrderMailEvents.config.workers.admin) {
      // try to get it out of the container
      const adminContainer = McmsDiContainer.findOne({id: OrderMailEvents.config.workers.admin});
      if (adminContainer.reference) {
        adminWorker = new adminContainer.reference().handle;
      }
    }

    if (OrderMailEvents.config.workers && OrderMailEvents.config.workers.customer) {
      // try to get it out of the container
      const customerContainer = McmsDiContainer.findOne({id: OrderMailEvents.config.workers.customer});
      if (customerContainer.reference) {
        customerWorker = new customerContainer.reference().handle;
      }
    }

    MailQueueService.addWorker(customerWorker, OrderMailEvents.customerQueueName);
    MailQueueService.addWorker(adminWorker, OrderMailEvents.adminQueueName);
  }

  /**
   * Triggered when order status changes. Send emails to the customer and the admin
   * @param uuid
   * @param status
   * @param destination
   */
  @OnEvent(OrderEventNames.orderStatusChanged)
  async orderStatusChanged({uuid, status, destination = ['admin', 'customer']}: {uuid: string, status: number, destination: string[]}) {

    if (destination.includes('customer')) {
      await OrderMailEvents.customerQueue.add(OrderMailEvents.customerQueueName, { ...{uuid, status}, ...{type: MailTypes.orderStatusChanged} });
    }

    if (destination.includes('admin')) {
      await OrderMailEvents.adminQueue.add(OrderMailEvents.adminQueueName, {  ...{uuid, status}, ...{type: MailTypes.orderStatusChanged} });
    }

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

  /**
   * Send emails to the customer and the admin. Triggered when order was first created
   * @param order
   */
  @OnEvent(OrderEventNames.orderAttachedToNodes)
  async onOrderAttachedToNodes(order: OrderModel) {
    try {
      await OrderMailEvents.customerQueue.add(OrderMailEvents.customerQueueName, { order, ...{type: MailTypes.orderCreated} });
    }
    catch (e) {
      console.log(`Failed to send email to customer`,e);
    }

    try {
      await OrderMailEvents.adminQueue.add(OrderMailEvents.adminQueueName, { order, ...{type: MailTypes.orderCreated} });
    }
    catch (e) {
      console.log(`Failed to send email to admin`,e);
    }
  }

  @OnEvent(OrderEventNames.orderPaid)
  async onOrderPaid() {

  }


  /**
   * Default worker for customer emails. Can be overridden in the config
   * @param job
   */
  async customerMailProcessor(job: Job<IMailJob>) {
    const service = new OrderMailEvents();

    const handler = service.handlers[job.data.type];

    if (!handler) {
      console.log(`No handler found for ${job.data.type}`);
      return;
    }

    let html, subject;
    try {
      const res = await handler(job.data, 'customer');
      html = res.html;
      subject = res.subject;
    }
    catch (e) {
      console.log(e);
      throw new Error(`Failed to render email template for order status changed: ${e.message}`);
    }


    if (!html || !subject) {
      console.log(`No html or subject found for ${job.data.type}`);
      throw new Error(`No html or subject found for ${job.data.type}`);
    }
    const uuid = (job.data.order) ? job.data.order.uuid : job.data.uuid;
    const order = await new OrderService().findOne({uuid}, ['*']);

    try {
      const ms = new MailService();
      await ms.send({
        from: `${OrderMailEvents.config.from.name} <${OrderMailEvents.config.from.mail}>`,
        to: `${order['user']['firstName']} ${order['user']['lastName']} <${order['user']['email']}>`,
        subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException(e);
    }
  }


  /**
   * Default worker for admin emails. Can be overridden in the config
   * @param job
   */
  async adminMailProcessor(job: Job<Partial<IMailJob>>) {
    const service = new OrderMailEvents();

    const handler = service.handlers[job.data.type];

    if (!handler) {
      console.log(`No handler found for ${job.data.type}`);
      return;
    }
    let html, subject;
    try {
     const res = await handler(job.data, 'admin');
      html = res.html;
      subject = res.subject;
    }
    catch (e) {
      console.log(e);
      throw new Error(`Failed to render email template for order status changed: ${e.message}`);
    }

    if (!html || !subject) {
      return;
    }

    try {
      const ms = new MailService();
      await ms.send({
        from: `${OrderMailEvents.config.from.name} <${OrderMailEvents.config.from.mail}>`,
        to: `${OrderMailEvents.config.adminEmail.name} <${OrderMailEvents.config.adminEmail.mail}>`,
        subject,
        html
      });
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException(e);
    }
  }

  async orderCreatedHandler(data: Partial<IMailJob>, type: 'admin' | 'customer' = 'admin') {
    const service = new OrderService();

    const order = await service.findOne({ uuid: data.order.uuid }, ['*']);
    const handlers = OrderMailEvents.config.order[type];
    const handler = handlers[order['status']];

    if (!handler || !handler.template) {
      throw new Error(`No handler found for order status ${order['status']}`);
    }


    let html;
    try {
      const viewsDir = OrderMailEvents.config.viewsDir;
      const config = {order, ...{config: getStoreProperty('configs.store')}};
      html = await maizzleRenderer(handler.template, config, viewsDir);
    }
    catch (e) {
      throw new Error(`Failed to render email template for order created : ${e.message}`);
    }

    const config = getStoreProperty('configs.store');

    const subject = sprintf(handler.subject, { storeName: config.name, order })

    return { html, subject};
  }

  async orderStatusChangedHandler(data: Partial<IMailJob>, type: 'admin' | 'customer' = 'admin') {
    const config = getStoreProperty('configs.store');
    const status = config.orderStatuses.find(s => s.id === data['status']);

    const service = new OrderService();
    const order = await service.findOne({uuid: data.uuid}, ['*']);
    const handlers = OrderMailEvents.config.order[type];

    const handler = handlers[status.id.toString()];


    if (!handler || !handler.template) {
      throw new Error(`${type}. No handler found for order status ${order['status']}`);
    }

    let html;
    try {
      const viewsDir = OrderMailEvents.config.viewsDir;
      const config = {order, ...{config: getStoreProperty('configs.store')}};
      html = await maizzleRenderer(handler.template, config, viewsDir);
    }
    catch (e) {
      throw new Error(`${type}. Failed to render email template for order status changed: ${e.message}`);
    }


    const subject = sprintf(handler.subject, { storeName: config.name, order })

    return { html, subject};
  }

  async orderAttachedToNodesHandler(data: Partial<IMailJob>) {
    console.log('In orderAttachedToNodesHandler', data);
  }
}
