import { OnApplicationBootstrap } from "@nestjs/common";
import { PhotosCsvProcessorService } from "~catalogue/import/services/photos-csv-processor.service";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { Job } from "bullmq";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import { CacheService } from "~shared/services/cache.service";
import { groupBy, sortBy } from "lodash";
import { IImportSchema, ImportService } from "~catalogue/import/services/import.service";
import { ImageService } from "~image/image.service";
import { ProductVariantService } from "~catalogue/product/services/product-variant.service";
import { HttpService } from "@nestjs/axios";
import { createWriteStream } from 'fs';
import { join, resolve } from "path";
import { uuid } from "uuidv4";
import * as path from "path";
import { store } from "~root/state";
import { ProductService } from "~catalogue/product/services/product.service";
const crypto = require('crypto')

export class ImportProductPhotosService implements OnApplicationBootstrap {
  public static jobEventName = "import:photos";
  protected static readonly importResultCacheKey = "import-photos-job-";
  private static defaultFieldMap: IImportProcessorFieldMap[] = [
    {
      importFieldName: 'variantID',
      name: 'variantId',
      required: false,
    },
    {
      importFieldName: 'productID',
      name: 'productId',
      required: false,
    },
    {
      importFieldName: 'image',
      name: 'image',
      required: true,
    },
  ];

  constructor(private readonly httpService: HttpService,) {
  }

  onApplicationBootstrap(): any {
    // register worker for this task
    ImportQueueService.addWorker(this.processIncomingUpload, ImportQueueService.photosImportQueueName);
  }

  async analyze(file: Express.Multer.File, limit = 10) {
    try {
      const processorService = new PhotosCsvProcessorService();
      processorService.setFieldMap(ImportProductPhotosService.defaultFieldMap);
      const res = await processorService.run(file);

      res.validRows = res.data.length;
      if (limit) {
        res.data = res.data.slice(0, limit);
      }

      return res;
    } catch (e) {
      console.log(`Error analyzing photos file ${file.filename}`, e);
    }
  }

  async processIncomingUpload(job: Job) {
    console.log(`processing Photos Import job ${job.id}`);

    const res = await(new ImportProductPhotosService(new HttpService())).processFile(job.data);
    // add to cache
    await(new CacheService()).put(
      `${ImportProductPhotosService.importResultCacheKey}${job.id}`,
      res,
      600,
    );
  }

  async processFile(file: Express.Multer.File) {
    const s = new ImportProductPhotosService(new HttpService());
    const res = await s.analyze(file);
    // Group the products by SKU. This needs to be extracted from each item in the array
    const group = groupBy(res.data, 'sku');
    const products = Object.keys(group).map(sku => ({
      sku,
      variants: sortBy(group[sku], 'variantId'),
    }));

    // Comes from config catalogue.import.overwriteImages in /config
    const overwriteImages = store.getState().configs.catalogue['import']['overwriteImages'];
    // const job = await ImportQueueService.imageProcessingQueue.add(ImportService.processImageJobEventName, { ...products[0], ...{processForReal: true} });
    try {



      await s.handleProductPhotos(products[0], overwriteImages);
    }
    catch (e) {
      console.log(`Error processing photos for product ${products[0].sku}`, e);
    }

    /**
     *     for (let idx = 0; products.length > idx; idx++) {
     *           try {
     *       // Comes from config catalogue.import.overwriteImages in /config
     *
     *
     *       await s.handleProductPhotos(products[idx], overwriteImages);
     *     }
     *     catch (e) {
     *       console.log(`Error processing photos for product ${products[idx].sku}`, e);
     *     }
     *     }
     */

    console.log('All photos processed');
  }

  private async handleProductPhotos(product: { variants: IImportSchema[]; sku: string }, overwriteImages = false) {
    if (!product.variants || product.variants.length === 0) {
      return;
    }
    const service = new ImageService();

    for (let idx = 0; product.variants.length > idx; idx++) {
      if (!product.variants[idx].image) {continue;}
      const variant = await (new ProductVariantService()).findOne({variantId: product.variants[idx].variantId}, ['images']);

      if (!variant) {continue;}

      // If the variant already has images, don't overwrite them
      if (Array.isArray(variant['images']) && variant['images'].length > 0 && !overwriteImages) {
        //check in the DB for this image
        const existingImage = await (new ImageService()).findOne({originalLocation: crypto.createHash('md5').update(product.variants[idx].image).digest("hex")});
        if (existingImage) {
          continue;
        }

      }


      // Look up for the image in the DB, don't want to upload duplicates
      // const existingImage = await (new ImageService()).findOne({url: product.variants[idx].image});

      const image = await this.downloadImageFromUrl(product.variants[idx].image);

      const img = await service.handle(image.filename as string, 'remote', {
        fromImport: true, originalFilename: path.basename(product.variants[idx].image),
        originalLocation: crypto.createHash('md5').update(image.url).digest("hex"),
      });
      await service.linkToObject({uuid: img.id}, 'ProductVariant', variant['uuid'], idx === 0 ? 'main' : 'additional', {fromImport: true});
      if (idx === 0) {
        // set it as a thumb property on the variant
        await (new ProductVariantService).update(variant['uuid'], {thumb: img.url});
        const found = await (new ProductService()).findOne({sku: product.sku});
        await service.linkToObject({uuid: img.id}, 'Product', found['uuid'], 'main', {fromImport: true});
        await (new ProductService()).update(found['uuid'], {thumb: img.url} as any);
      }
      console.log(`Variant ${variant['variantId']} linked to image ${img.id}`)
    }
  }

  protected async downloadImageFromUrl(url: string): Promise<{filename: string; url: string}> {
    const filename = resolve(join( './', 'upload', path.basename(url)))

    const writer = createWriteStream(filename);

    const response = await this.httpService.axiosRef({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ filename, url }));
      writer.on('error', (e)  => reject(e));
    });
  }
}
