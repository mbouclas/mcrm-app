import { IBaseMailMessage, IBaseMailServiceDriver } from "~root/mail/services/mail.service";
const Mailjet = require('node-mailjet');
import { SendEmailFailedException } from "~root/mail/exceptions/SendEmailFailed.exception";

export class MailJetMail implements IBaseMailMessage {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  text?: string;
  html?: string;
}

export class MailjetDriver implements IBaseMailServiceDriver {
  name = "mailjet";
  client: typeof Mailjet;

  constructor() {
    this.client = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET
    });
  }

  async send(message: MailJetMail): Promise<boolean> {
    try {
      const res = await this.client
        .post("send", { version: "v3.1" })
        .request({
          Messages: [
            {
              From: {
                Email: message.from,
                Name: message.fromName
              },
              To: [
                {
                  Email: message.to,
                  Name: message.toName
                }
              ],
              Subject: message.subject,
              TextPart: message.text,
              HTMLPart: message.html
            }
          ]
        });
    }
    catch (e) {
      console.log(`Mailjet send email failed: ${e}`);
      throw new SendEmailFailedException(`Mailjet send email failed: ${e}`, '850.1');
    }

    return true;
  }
}
