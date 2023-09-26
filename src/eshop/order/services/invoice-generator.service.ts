import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PdfService } from "~root/pdf/pdf.service";
import { getStoreProperty } from "~root/state";
import { OrderService } from "~eshop/order/services/order.service";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { UploadModule } from "~root/upload/upload.module";

@Injectable()
export class InvoiceGeneratorService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
/*    setTimeout(async () => {
      const config = getStoreProperty('configs.pdf');
      const pdfService = new PdfService(config)
      await pdfService.generate({name: 'Michael'}, getStoreProperty('configs.store.invoices.pdf.templateFile'))
    }, 1000);*/

  }

  async generate(uuid: string, regenerate = false) {
    const service = new OrderService();
    const config = getStoreProperty('configs.store.invoices');
    const oss = new ObjectStorageService();
    const order = await service.findOne({uuid}, ['*']);
    const outputFileName = `${order.orderId}.pdf`;

    // see if there's a generated invoice and return that
    if (!regenerate) {
      try {
        const found = await oss.getObjectUrl(config['serviceOptions']['bucketName'], outputFileName);
        return { filename: found }
      }
      catch (e) {

      }
    }


    const pdfService = new PdfService(config['pdf']);


    const res = await pdfService.generate(order, getStoreProperty('configs.store.invoices.pdf.templateFile'), outputFileName);
    if (!config['serviceOptions']['saveToObjectStorage']) {
      return res;
    }



    try {
      await oss.bucketExistsOrCreate(config['serviceOptions']['bucketName']);
    }
    catch (e) {
      console.log(`Error creating bucket: ${e.message}`);
      return false;
    }

    try {
      await oss.createObject(config['serviceOptions']['bucketName'], res.filename, {type: 'pdf'});
    }
    catch (e) {
      console.log(`Error creating object: ${e.message}`);
      return false;
    }

    try {
      res.filename = await oss.getObjectUrl(config['serviceOptions']['bucketName'], outputFileName);
    }
    catch (e) {
      console.log(`Error getting object url: ${e.message}`);
    }


    return res;
  }
}
