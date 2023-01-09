import { SendEmailFailedException } from '../exceptions/SendEmailFailed.exception';

const mailgun = require('mailgun-js');
import { Mailgun } from 'mailgun-js';
import { IBaseMailMessage, IBaseMailServiceDriver } from '../Mail.service';

export class MailGunMail implements IBaseMailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class MailgunDriver implements IBaseMailServiceDriver {
  name = 'mailgun';
  client: Mailgun;

  constructor() {
    this.client = mailgun({
      host: process.env.MAILGUN_HOST,
      apiKey: process.env.MAILGUN_SECRET,
      domain: process.env.MAILGUN_DOMAIN,
    });
  }

  async send(mail: MailGunMail) {
    try {
      await this.client.messages().send(mail);
    } catch (e) {
      throw new SendEmailFailedException(`Mailgun send email failed: ${e}`);
    }

    return true;
  }
}
