import {
  IBaseMailMessage,
  IBaseMailServiceDriver,
} from '../services/mail.service';
const nodemailer = require('nodemailer');
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class SmtpMail implements IBaseMailMessage {
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}

export class SmtpDriver implements IBaseMailServiceDriver {
  name = 'smtp';
  client: any;

  constructor() {
    const poolOptions = {
      pool: false,
      maxConnections: 1,
      maxMessages: 5,
    };

    console.log(process.env.SMTP_USERNAME, process.env.SMTP_PASSWORD);
    const smtpOptions = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT as string),
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    const nodemailerOptions: SMTPTransport.Options = {
      ...poolOptions,
      ...smtpOptions,
    };

    this.client = nodemailer.createTransport(nodemailerOptions);
  }

  async send(message: SmtpMail): Promise<boolean> {
    try {
      await this.client.sendMail(message);
    } catch (e) {}

    return true;
  }
}
