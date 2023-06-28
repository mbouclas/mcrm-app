import { MailgunDriver } from '../drivers/mailgun.driver';
import { SendEmailFailedException } from '../exceptions/SendEmailFailed.exception';
import { SmtpDriver } from '../drivers/smtp.driver';
import { MailjetDriver } from "~root/mail/drivers/mailjet.driver";

export interface IBaseMailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IBaseMailServiceDriver {
  name: string;
  send(message: IBaseMailMessage): Promise<boolean>;
}

export class MailService {
  availableDrivers: { [key: string]: any } = {
    mailgun: MailgunDriver,
    mailjet: MailjetDriver,
    smtp: SmtpDriver,
  };

  driver: IBaseMailServiceDriver;

  constructor(driver?: string) {
    if (!driver && !process.env.MAIL_DRIVER) {
      // throw new DriverNotFoundException('No driver found');
    }

    const key = (driver as string) || (process.env.MAIL_DRIVER as string);
    if (!this.availableDrivers[key]) {
      // check the availableDrivers list
      // throw new DriverNotFoundException(`Driver ${key} is not listed`);
    }

    this.driver = new this.availableDrivers[key]();
  }

  async send(message: IBaseMailMessage) {
    try {
      await this.driver.send(message);
    } catch (e) {
      throw new SendEmailFailedException(e);
    }
  }
}
