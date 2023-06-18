import { Injectable } from '@nestjs/common';
import { OnEvent } from "@nestjs/event-emitter";
import { getStoreProperty } from "~root/state";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { UserService } from "~user/services/user.service";
import { UserModel } from "~user/models/user.model";
import { MailQueueEventNames, MailQueueService } from "~root/mail/queues/mail.queue.service";
import { Job, Queue } from "bullmq";
import { ViewEngine } from "~root/main";
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";
import { MailService } from "~root/mail/services/mail.service";
import { sprintf } from "sprintf-js";
import { ExecutorsService } from "~shared/services/executors.service";

export interface ICustomerJob {
  user: UserModel;
  type: NotificationsQueueEventNames;
}

enum NotificationsQueueEventNames {
  created = 'sendVerificationEmail',
  verified = 'sendWelcomeEmail',
  forgotPassword = 'sendForgotPasswordEmail',
  resetPassword = 'sendResetPasswordEmail',
  updatedPassword = 'sendUpdatedPasswordEmail',
}

@Injectable()
export class NotificationsService extends BaseNeoService {
  public static config: any;
  public static queueName = `${MailQueueEventNames.default}:customerEmails`;
  public static queue: Queue;

     async onModuleInit() {

    NotificationsService.queue = new Queue(NotificationsService.queueName, {
      connection: MailQueueService.redisConnection
    });

    NotificationsService.queue.on('waiting', (job) => console.log(`${NotificationsService.queueName}: ${job.id}  now waiting`));
    MailQueueService.addWorker(this.customerWorker, NotificationsService.queueName);
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    NotificationsService.config = getStoreProperty("configs.store.notifications.email");
    // const user = await (new UserService()).findOne({email: 'kid@rock.com'});
    // await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'created' } );
    // await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'verified' } );
  }


  /**
   * When a new guest user is created, we need to send a notification to the admin and a verification email to the user
   * @param user
   */
  @OnEvent(UserService.createdEventName)
  async onUserCreated(user: UserModel) {
    // we only care about guest users
    if (user.type !== 'guest') {
      return;
    }

    await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'verified' } );
  }

  @OnEvent(UserService.userVerifiedEventName)
  async onUserVerified(user: UserModel) {
    await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'verified' } );
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

    try {
      html = await ViewEngine.renderFile(NotificationsService.config.user.created.customer.template, storeConfig);
    } catch (e) {
      console.log(e);
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

    try {
      html = await ViewEngine.renderFile(NotificationsService.config.user.verified.customer.template, storeConfig);
    } catch (e) {
      console.log(e);
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

  async sendForgotPasswordEmail(user: UserModel) {
    if (NotificationsService.config.user.resetPassword.customer.executor) {
      ExecutorsService.executorFromString(NotificationsService.config.user.resetPassword.customer.executor, false, true, [user] );
      return ;
    }
  }

  async sendResetPasswordEmail(user: UserModel) {
    if (NotificationsService.config.user.resetPassword.customer.executor) {
      ExecutorsService.executorFromString(NotificationsService.config.user.resetPassword.customer.executor, false, true, [user] );
      return ;
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
