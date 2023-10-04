import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PdfService } from "~root/pdf/pdf.service";
import { getStoreProperty } from "~root/state";
import { OrderService } from "~eshop/order/services/order.service";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { UploadModule } from "~root/upload/upload.module";
import { readFileSync } from "fs";
import { OrderModel } from "~eshop/order/models/order.model";
import { formatDate } from "~helpers/dates";
import { stat } from "fs/promises";
import { resolve } from "path";
import { moneyFormat } from "~helpers/data";
import { getHooks } from "~shared/hooks/hook.decorator";

@Injectable()
export class InvoiceGeneratorService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    setTimeout(async () => {
/*      const config = getStoreProperty('configs.pdf');
      const pdfService = new PdfService(config)
      const res = await pdfService.generate({name: 'Michael'}, getStoreProperty('configs.store.invoices.pdf.templateFile'))
      console.log(res);*/
      // const service = new InvoiceGeneratorService();
      // const res = await service.generate('3caf535b-d44b-4394-9e1f-1454a5b1ce72', true)
      // console.log(res)
    }, 1000);

  }

  async generate(uuid: string, regenerate = false) {
    const service = new OrderService();
    const config = getStoreProperty('configs.store.invoices');
    const oss = new ObjectStorageService();
    const order = await service.findOne({uuid}, ['*']);
    const storeConfig = getStoreProperty('configs.store');
    const outputFileName = resolve(storeConfig['invoices']['pdf']['driverOptions']['outputDirectory'], `${order.orderId}.pdf`);

    // see if there's a generated invoice and return that

    if (!regenerate) {
      try {
        const found = await oss.getObjectUrl(config['serviceOptions']['bucketName'], outputFileName);
        return { filename: found }
      }
      catch (e) {
      }
    }

    const hooks = getHooks({category: 'Order'});
    const pdfService = new PdfService(config['pdf']);
    const user = order['user'];
    let inputParams = {order, store: storeConfig, user};

    if (hooks && typeof hooks.beforePdfGeneration === 'function') {
      inputParams = await hooks.beforePdfGeneration({order, store: storeConfig, user});
    }

    let params = await this.formatPdfVariables(inputParams);

    if (hooks && typeof hooks.params === 'function') {
      params = await hooks.params({order, store: storeConfig, user});
    }

    const res = await pdfService.generate(params, getStoreProperty('configs.store.invoices.pdf.templateFile'), outputFileName);

    if (hooks && typeof hooks.invoiceGeneratedAfter === 'function') {
      await hooks.invoiceGeneratedAfter(res);
    }

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

  private async formatPdfVariables(input: { store: any; user: any; order: OrderModel }) {
    input.order['createdAt'] = formatDate(input.order['createdAt'], input.store['invoices']['dateFormat']);
    input.store['logo'] = input.store['invoices']['logo'];

    input['address'] = input.order['address'].find(a => a.type.map(t => t.toLowerCase()).includes('billing'));

    input.order['metaData']['cart']['items'].forEach((item) => {
      item.price = moneyFormat(item.price);
    });

    input.order['total'] = moneyFormat(input.order['total']);
    input.order['metaData']['cart']['subTotal'] = moneyFormat(input.order['metaData']['cart']['subTotal']);

    return input;
  }
}

