import { Injectable, OnModuleInit } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { OrderEventNames, OrderService } from "~eshop/order/services/order.service";
import { OrderModel } from "~eshop/order/models/order.model";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { Job, Queue } from "bullmq";
import { ViewEngine } from "~root/main";
import { store } from "~root/state";
import { IEmailConfig, INotificationsConfig } from "~eshop/models/config.model";
import { MailService } from "~root/mail/services/mail.service";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";

export enum MailTypes {
  orderCreated = 'orderCreated',
}

interface IMailJob {
  type: MailTypes;
  order: OrderModel;
}

@Injectable()
export class OrderMailEvents implements OnModuleInit {
  public static customerQueueName = `${MailQueueEventNames.default}:customer`;
  public static adminQueueName = `${MailQueueEventNames.default}:admin`;
  public static adminQueue: Queue;
  public static customerQueue: Queue;
  protected static config: IEmailConfig;
  async onModuleInit() {
    OrderMailEvents.customerQueue = new Queue(OrderMailEvents.customerQueueName, {
      connection: MailQueueService.redisConnection
    });

    OrderMailEvents.adminQueue = new Queue(OrderMailEvents.adminQueueName, {
      connection: MailQueueService.redisConnection
    });

    OrderMailEvents.customerQueue.on('waiting', (job) => console.log(`${OrderMailEvents.customerQueueName}: ${job.id}  now waiting`));
    OrderMailEvents.adminQueue.on('waiting', (job) => console.log(`${OrderMailEvents.adminQueueName}: ${job.id}  now waiting`));

    MailQueueService.addWorker(this.customerMailProcessor, OrderMailEvents.customerQueueName);
    MailQueueService.addWorker(this.adminMailProcessor, OrderMailEvents.adminQueueName);
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    try {
      const order = await (new OrderService()).findOne({orderId: 'c59f7d2d-0f1f-4cf5-a254-006e47ddefbb'}, ['*']);
      await (new OrderMailEvents()).onOrderAttachedToNodes(order);
      OrderMailEvents.config = store.getState().configs['store']['notifications']['email'];
    }
    catch (e) {
      console.log(e)
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
   * Send emails to the customer and the admin
   * @param order
   */
  @OnEvent(OrderEventNames.orderAttachedToNodes)
  async onOrderAttachedToNodes(order: OrderModel) {
    const customerMailJob = await OrderMailEvents.customerQueue.add(OrderMailEvents.customerQueueName, { order, ...{type: MailTypes.orderCreated} });
    const adminMailJob = await OrderMailEvents.adminQueue.add(OrderMailEvents.adminQueueName, { order, ...{type: MailTypes.orderCreated} });
  }

  @OnEvent(OrderEventNames.orderPaid)
  async onOrderPaid() {

  }

// Delegate from here depending on the type of mail. Load the template and send the mail
  async customerMailProcessor(job: Job<IMailJob>) {
    console.log('In customer mail processor', job.id, job.data.type);
  }

// Delegate from here depending on the type of mail. Load the template and send the mail
  async adminMailProcessor(job: Job<IMailJob>) {
    let html;
    try {
      html = await ViewEngine.renderFile(OrderMailEvents.config.order.admin.created.template, { order: job.data.order });
    } catch (e) {
      console.log(e);
    }


    const ms = new MailService();
    try {
      await ms.send({
        from: `${OrderMailEvents.config.from.name} <${OrderMailEvents.config.from.mail}>`,
        to: `${OrderMailEvents.config.adminEmail.name} <${OrderMailEvents.config.adminEmail.mail}>`,
        subject: OrderMailEvents.config.order.admin.created.subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException(e);
    }
  }
}
