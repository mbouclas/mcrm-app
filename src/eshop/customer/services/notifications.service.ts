import { Injectable } from '@nestjs/common';
import { OnEvent } from "@nestjs/event-emitter";
import { getStoreProperty } from "~root/state";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { UserService } from "~user/services/user.service";
import { UserModel } from "~user/models/user.model";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { Job, Queue } from "bullmq";
import { projectRoot, ViewEngine } from "~root/main";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";
import { MailService } from "~root/mail/services/mail.service";
import { sprintf } from "sprintf-js";
import { ExecutorsService } from "~shared/services/executors.service";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { maizzleRenderer } from "~helpers/maizzle.renderer";


export interface ICustomerJob {
  user: UserModel;
  type: NotificationsQueueEventNames;
}

enum NotificationsQueueEventNames {
  created = 'sendVerificationEmail',
  verified = 'sendWelcomeEmail',
  resetPassword = 'sendResetPasswordEmail',
  updatedPassword = 'sendUpdatedPasswordEmail',
}

@McmsDi({
  id: 'NotificationsService',
  type: 'service',
})
@Injectable()
export class NotificationsService extends BaseNeoService {
  public static config: any;
  public static queueName = `${MailQueueEventNames.default}:customerEmails`;
  public static queue: Queue;




  async onModuleInit() {

    NotificationsService.queue = new Queue(NotificationsService.queueName, {
      connection: MailQueueService.redisConnection
    });

    NotificationsService.queue.on("waiting", (job) => console.log(`${NotificationsService.queueName}: ${job.id}  now waiting`));
    MailQueueService.addWorker(this.customerWorker, NotificationsService.queueName);
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    NotificationsService.config = getStoreProperty("configs.store.notifications.email");
    // const user = await (new UserService()).findOne({email: 'mbouclas@gmail.com'});
    // await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'created' } );
    // await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'verified' } );
    // await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'resetPassword' } );



  }

  async customerWorker(job: Job<ICustomerJob>) {
    const service = new NotificationsService();
    if (typeof service[NotificationsQueueEventNames[job.data.type]] !== 'function') {
      return;
    }

    await service[NotificationsQueueEventNames[job.data.type]](job.data.user);
  }

  /**
   * Send a verification email to the user
   * @param user
   */
  async sendVerificationEmail(user: UserModel) {
    let html;
    const storeConfig = {user, ...{config: getStoreProperty('configs.store')}};

    if (NotificationsService.config.user.created.customer.executor) {
      ExecutorsService.executorFromString(NotificationsService.config.user.created.customer.executor, false, true, [user] );
      return ;
    }

/*    try {
      html = await ViewEngine.renderFile(NotificationsService.config.user.created.customer.template, storeConfig);
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }*/

    try {
      html = await maizzleRenderer(NotificationsService.config.user.created.customer.template, storeConfig);
    }
    catch (e) {
      console.log(`Error rendering template ${NotificationsService.config.user.created.customer.template}`, e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }


    try {
      await NotificationsService.sendEmailToCustomer(user, html, sprintf(NotificationsService.config.user.created.customer.subject, {storeName: storeConfig.config.name}));
    }
    catch (e) {
      console.log(e)
      throw (e);
    }
  }

  async sendWelcomeEmail(user: UserModel) {
    await this.sendWelcomeEmailToCustomer(user);
    await this.sendNewCustomerEmailToAdmin(user);
  }

  async sendWelcomeEmailToCustomer(user: UserModel) {
    let html;
    const storeConfig = {user, ...{config: getStoreProperty('configs.store')}};
    if (NotificationsService.config.user.verified.customer.executor) {
      ExecutorsService.executorFromString(NotificationsService.config.user.verified.customer.executor, false, true, [user] );
      return ;
    }

/*    try {
      html = await ViewEngine.renderFile(NotificationsService.config.user.verified.customer.template, storeConfig);
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }*/

    try {
      html = await maizzleRenderer(NotificationsService.config.user.verified.customer.template, storeConfig);
    }
    catch (e) {
      console.log(`Error rendering template ${NotificationsService.config.user.verified.customer.template}`, e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }


    try {
      await NotificationsService.sendEmailToCustomer(user, html, sprintf(NotificationsService.config.user.verified.customer.subject, {storeName: storeConfig.config.name}));
    }
    catch (e) {
      console.log(e)
      throw (e);
    }
  }


  async sendResetPasswordEmail(user: UserModel) {
    if (NotificationsService.config.user.resetPassword.customer.executor) {
      ExecutorsService.executorFromString(NotificationsService.config.user.resetPassword.customer.executor, false, true, [user] );
      return ;
    }

    const service = new UserService();
    const u = await service.findOne({email: user.email});

    if (!u.forgotPasswordToken) {
      return;
    }

    let html;
    const storeConfig = {config: getStoreProperty('configs.store')};
    const config = NotificationsService.config.user.resetPassword.customer;

    try {
      html = await maizzleRenderer(config.template, {...storeConfig, user: u, chars: u.forgotPasswordToken.split('')});
    }
    catch (e) {
      console.log(`Error rendering template ${config.template}`, e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }

/*    try {
      html = await ViewEngine.renderFile(config.template, { storeConfig, user: u });
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }*/


    try {
      await NotificationsService.sendEmailToCustomer(user, html, sprintf(config.subject, {storeName: storeConfig.config.name, user: u}));
    }
    catch (e) {
      console.log(e)
      throw (e);
    }
  }

  async sendUpdatedPasswordEmail(user: UserModel) {

  }

  async sendNewCustomerEmailToAdmin(user: UserModel) {
    let html;
    const storeConfig = {user, ...{config: getStoreProperty('configs.store')}};
    try {
      html = await ViewEngine.renderFile(NotificationsService.config.user.verified.admin.template, storeConfig);
    } catch (e) {
      console.log(e);
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.1', { error: e });
    }

    try {
      await NotificationsService.sendEmailToAdmin(user, html, sprintf(NotificationsService.config.user.verified.admin.subject, {storeName: storeConfig.config.name}));
    }
    catch (e) {
      console.log(e)
      throw (e);
    }
  }

  static async sendEmailToCustomer(user: UserModel, html: string, subject: string) {
    const ms = new MailService();
    try {
      await ms.send({
        from: `${NotificationsService.config.from.name} <${NotificationsService.config.from.mail}>`,
        to: `${user.firstName} ${user.lastName} <${user.email}>`,
        subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.2', { error: e });
    }
  }

  static async sendEmailToAdmin(user: UserModel, html: string, subject: string) {
    const ms = new MailService();
    try {
      await ms.send({
        from: `${NotificationsService.config.from.name} <${NotificationsService.config.from.mail}>`,
        to: `${NotificationsService.config.from.name} <${NotificationsService.config.from.mail}>`,
        subject,
        html
      });
    } catch (e) {
      console.log(e)
      throw new SendEmailFailedException('FAILED_TO_SEND_EMAIL', '105.3', { error: e });
    }
  }
}
