import { Injectable } from "@nestjs/common";
import { getStoreProperty } from "~root/state";
import { Job, Queue } from "bullmq";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { ViewEngine } from "~root/main";
import { MailService } from "~root/mail/services/mail.service";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";
import { OnEvent } from "@nestjs/event-emitter";
import { maizzleRenderer } from "~helpers/maizzle.renderer";
import { ProductService } from "~catalogue/product/services/product.service";

interface IMailJob<T> {
  type: 'contact'|'requestPrice';
  data: T;
}

export interface IContactForm {
  firstName: string;
  lastName: string;
  email: string;
  question: string;
  phone: string;
}

export interface IContactFormRequestPrice {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  productId: string;
}

@Injectable()
export class ContactFormsService {
  public static queueName = `${MailQueueEventNames.default}:contactForm`;
  public static queue: Queue;
  public static config: any;

  @OnEvent('app.loaded')
  async onAppLoaded() {
    ContactFormsService.config = getStoreProperty("configs.mail");
  }

  async onModuleInit() {

    ContactFormsService.queue = new Queue(ContactFormsService.queueName, {
      connection: MailQueueService.redisConnection
    });

    ContactFormsService.queue.on('waiting', (job) => console.log(`${ContactFormsService.queueName}: ${job.id}  now waiting`));
    MailQueueService.addWorker(this.worker, ContactFormsService.queueName);
  }

  async contactFormRenderer(data: IContactForm) {
    let html;
    const mailConfig = getStoreProperty('configs.mail');

    try {

      html = await maizzleRenderer(mailConfig.contactForm.template, {config: getStoreProperty('configs.store'), data }, mailConfig.viewsDir)
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }

    const ms = new MailService();
    try {
      await ms.send({
        from: `${mailConfig.from.name} <${mailConfig.from.mail}>`,
        to: `${mailConfig.adminEmail.name} <${mailConfig.adminEmail.mail}>`,
        subject: mailConfig.contactForm.subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.2', { error: e });
    }
  }

  async requestPriceRenderer(data: IContactFormRequestPrice) {
    let html;
    const mailConfig = getStoreProperty('configs.mail');
    try {

      html = await maizzleRenderer(mailConfig.requestPrice.template, {config: getStoreProperty('configs.store'), data }, mailConfig.viewsDir)
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }

    const ms = new MailService();
    try {
      await ms.send({
        from: `${mailConfig.from.name} <${mailConfig.from.mail}>`,
        to: `${mailConfig.adminEmail.name} <${mailConfig.adminEmail.mail}>`,
        subject: mailConfig.requestPrice.subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.2', { error: e });
    }
  }

  async worker(job: Job<IMailJob<IContactForm|IContactFormRequestPrice>>) {
    const s = new ContactFormsService();
    if (job.data.type === 'contact') {
      await s.contactFormRenderer(job.data.data as IContactForm);
    }
    else if (job.data.type === 'requestPrice') {
      await s.requestPriceRenderer(job.data.data as IContactFormRequestPrice);
    }

  }

  async submitContactForm(data: any, type: 'contact'|'requestPrice' = 'contact') {
    await ContactFormsService.queue.add(ContactFormsService.queueName, {type, data}  );

    return { success: true, message: "Contact form submitted" };
  }

  async requestPrice(data: any) {
    const product = await (new ProductService()).findOne({uuid: data.productId});
    if (!product) {
      return { success: false, message: "Product not found" };
    }

    await this.submitContactForm({ ...data, ...{product} },'requestPrice')
    return { success: true, message: "Contact form submitted" };
  }
}
