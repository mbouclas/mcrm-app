import { Injectable } from "@nestjs/common";
import { getStoreProperty } from "~root/state";
import { Job, Queue } from "bullmq";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { ViewEngine } from "~root/main";
import { MailService } from "~root/mail/services/mail.service";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";
import { OnEvent } from "@nestjs/event-emitter";
import { maizzleRenderer } from "~helpers/maizzle.renderer";

interface IMailJob {
  firstName: string;
  lastName: string;
  email: string;
  question: string;
  phone: string;
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
    MailQueueService.addWorker(this.contactFormWorker, ContactFormsService.queueName);
  }

  async contactFormWorker(job: Job<IMailJob>) {
    let html;
/*    try {
      html = await ViewEngine.renderFile(ContactFormsService.config.contactForm.template, job.data);
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }*/

    try {
      html = await maizzleRenderer(ContactFormsService.config.contactForm.template, {config: getStoreProperty('configs.store'), data: job.data })
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }

    const ms = new MailService();
    try {
      await ms.send({
        from: `${ContactFormsService.config.from.name} <${ContactFormsService.config.from.mail}>`,
        to: `${ContactFormsService.config.adminEmail.name} <${ContactFormsService.config.adminEmail.mail}>`,
        subject: ContactFormsService.config.contactForm.subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.2', { error: e });
    }
  }

  async submitContactForm(data: any) {
    await ContactFormsService.queue.add(ContactFormsService.queueName, data );

    return { success: true, message: "Contact form submitted" };
  }
}
