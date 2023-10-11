import { McmsDi } from "~helpers/mcms-component.decorator";
import {
  BasePaymentMethodProvider,

} from "~eshop/payment-method/providers/base-payment-method.provider";
import { InvalidOrderException } from "~eshop/order/exceptions/invalid-order.exception";
import { IGenericObject } from "~models/general";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { UploadModule } from "~root/upload/upload.module";
import { OnEvent } from "@nestjs/event-emitter";
import { PaymentMethodModule } from "~eshop/payment-method/payment-method.module";
import { FilesService } from "~files/files.service";
import { z } from "zod";

export interface IQuoteFileAttachment {
  id: string;
  filename: string;
  originalName: string;
  description: string;
  url?: string;
  metaData?: IGenericObject;
  uuid?: string;
}

const settingsSchema = z.object({
  allowFileUploads: z.boolean().describe('json:{"label": "Allow file uploads", "placeholder": "Allow file uploads", "hint": "Allow file uploads"}'),
});

@McmsDi({
  id: 'QuoteProvider',
  type: 'paymentMethodProvider',
  description: 'Create a quote from the cart',
  title: 'Quote',
})
export class QuoteProvider extends BasePaymentMethodProvider {
  protected bucketName = 'quotes';
  protected static handleAttachmentEventName = 'quote.attachment';
  static settingsSchema = settingsSchema;
  @OnEvent(QuoteProvider.handleAttachmentEventName)
  async onHandleAttachments({ attachments, settings }) {
    const service = new QuoteProvider(settings);
    try {
      await service.handleAttachments(attachments);
    } catch (e) {
      console.log(`Error attaching quote attachments to order: ${e.message}`);
      throw new InvalidOrderException(e.message, '800.1', e as any);
    }
  }

  /**
   * Entry method when invoked via the container or as a driver
   */
  async handle() {
    // this.bucketName = crypto.createHash('md5').update(this.settings.user.email).digest("hex");
    const attachments = this.settings.cart.items.filter(item => item.metaData && item.metaData.uploadedFiles && Array.isArray(item.metaData.uploadedFiles))
      .map(item => item.metaData.uploadedFiles).flat();

    try {
      await this.attachToOrder();
    }
    catch (e) {
      throw new InvalidOrderException(e.message, '900.2', e as any);
    }

    // push attachments to the event bus cause they may take a minute to upload
    PaymentMethodModule.eventEmitter.emit(QuoteProvider.handleAttachmentEventName, { attachments, settings: this.settings });
    return this;
  }

  async handleAttachments(attachments: IQuoteFileAttachment[]) {
    for (const attachment of attachments) {
      try {
        const res = await this.handleAttachment(attachment);
      }
      catch (e) {
        console.log(`Error handling attachment: ${e.message}`);
      }
    }
  }


  async handleAttachment(attachment: IQuoteFileAttachment) {
    const oss = new ObjectStorageService();
    // move the files somewhere else, S3, etc.
    try {
      await oss.bucketExistsOrCreate(this.bucketName);
    }
    catch (e) {
      console.log(`Error creating bucket: ${e.message}`);
      return false;
    }

    try {
      await oss.createObject(this.bucketName, `${UploadModule.uploadDir}${attachment.filename}`, {type: 'attachment'});
    }
    catch (e) {
      console.log(`Error creating object: ${e.message}`);
      return false;
    }

    try {
      attachment.url = await oss.getObjectUrl(this.bucketName, attachment.filename);
    }
    catch (e) {
      console.log(`Error getting object url: ${e.message}`);
    }

    attachment.metaData = {};

    const fileService = new FilesService();
    // create a new node in the database with the information of the file
    const mime = require('mime');
    const mime_type = mime.getType(`${UploadModule.uploadDir}${attachment.filename}`)
    try {
      const res = await fileService.store({
        bucket: this.bucketName,
        filename: attachment.filename,
        description: attachment.description,
        driver: 'object-storage',
        originalFilename: attachment.originalName,
        mimeType: mime_type,
      });

      attachment.uuid = res.uuid;
    }
    catch (e) {
      console.log(`Error storing attachment on the DB: ${e.message}`);
    }
    return attachment;
  }
}
