import { Logger, OnApplicationBootstrap } from "@nestjs/common";
import { PhotosCsvProcessorService } from "~catalogue/import/services/photos-csv-processor.service";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { Job } from "bullmq";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import { CacheService } from "~shared/services/cache.service";
import { IImportSchema} from "~catalogue/import/services/import.service";
import { ImageService } from "~image/image.service";
import { ProductVariantService } from "~catalogue/product/services/product-variant.service";
import { HttpService } from "@nestjs/axios";
import { createWriteStream } from 'fs';
import { join, resolve } from "path";
import * as path from "path";
import { ProductService } from "~catalogue/product/services/product.service";
import { OnEvent } from "@nestjs/event-emitter";
import { IGenericObject } from "~models/general";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { extractFiltersFromObject, extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import { Logger as WinstonLogger } from "winston";
import { logToFile } from "~helpers/log-to-file";
const crypto = require('crypto')

export interface IImportPhotosFromEventSchema {
  model: string
  input: IImageImportSchema[];
}

export interface IImageImportSchema {
  sku: string;
  itemFilter?: IGenericObject;
  image: string;
  model: string;
  type: 'main'|'additional';
}

export class ImportProductPhotosService implements OnApplicationBootstrap {
  public static jobEventName = "import:photos";
  protected static readonly importResultCacheKey = "import-photos-job-";
  public static readonly importPhotosStartEventName = "import.photos.start";
  private readonly logger = new Logger(ImportProductPhotosService.name);
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

  protected static fileLogger: WinstonLogger;

  constructor(private readonly httpService: HttpService,) {
  }

  onApplicationBootstrap(): any {
    // register worker for this task
    ImportQueueService.addWorker(this.processIncomingUpload, ImportQueueService.photosImportQueueName);
  }

  @OnEvent(ImportProductPhotosService.importPhotosStartEventName)
  async onImportPhotosStart(data: IImageImportSchema[]) {
    const s = new ImportProductPhotosService(new HttpService());
    try {
      await s.processData(data);
    }
    catch (e) {
      console.log('Error processing photos', e);
    }
  }

  public initializeLogger() {
    ImportProductPhotosService.fileLogger = logToFile();
  }


  async analyze(file: Express.Multer.File, limit?: number) {
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

    try {
      await this.processData(res.data);
    }
    catch (e) {
      console.log('Error processing photos', e);
    }

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


      const imageHash = crypto.createHash('md5').update(product.variants[idx].image).digest("hex");
      let existingImage;
      try {
        existingImage = await (new ImageService()).findOne({originalLocation: imageHash});
      }
      catch (e) {
        this.logger.debug('---- Image Not Found', imageHash, product.variants[idx].image)
      }

      // If the variant already has images, don't overwrite them

      if (Array.isArray(variant['images']) && variant['images'].length > 0 && !overwriteImages) {
        continue;
      }

      if (existingImage) {
        await (new ProductVariantService).update(variant['uuid'], {thumb: existingImage.url});
      }

      if (!existingImage) {
        const image = await this.downloadImageFromUrl(product.variants[idx].image);
        const newHash = crypto.createHash('md5').update(image.url).digest("hex");
        existingImage = await service.handle(image.filename as string, 'remote', {
          fromImport: true, originalFilename: path.basename(product.variants[idx].image),
          originalLocation: newHash,
        });
        existingImage.uuid = existingImage.id;
        await service.update(existingImage.id, {originalLocation: newHash});
        this.logger.log(`Uploaded image ${existingImage.id} - ${newHash})`);
      }


      await service.linkToObject({uuid: existingImage.uuid}, 'ProductVariant', variant['uuid'], idx === 0 ? 'main' : 'additional', {fromImport: true});
      if (idx === 0) {
        // set it as a thumb property on the variant
        await (new ProductVariantService).update(variant['uuid'], {thumb: existingImage.url});
        const found = await (new ProductService()).findOne({sku: product.sku});
        await service.linkToObject({uuid: existingImage.uuid}, 'Product', found['uuid'], 'main', {fromImport: true});

        await (new ProductService()).update(found['uuid'], {thumb: existingImage.url} as any);
      }
      console.log(`Variant ${variant['variantId']} linked to image ${existingImage.uuid}`)
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

  public async processData(input: Partial<IImageImportSchema>[]) {
    this.initializeLogger();

    for (let idx = 0; input.length > idx; idx++) {
      const item = input[idx];
      try {
        await this.handlePhoto(item);
      }
      catch (e) {
        console.log(`Error processing photo ${item.image}`, e);
      }
    }

    console.log('All photos processed');
  }

  async handlePhoto(item: Partial<IImageImportSchema>) {
    const imageService = new ImageService();
    let imageUrl: string;
    try {
      const json = JSON.parse(item.image);
      imageUrl = json.url;
    }
    catch (e) {
      imageUrl = item.image;
    }

    ImportProductPhotosService.fileLogger.info(`Importing Image ${imageUrl}`, {method: 'handlePhoto', imageUrl});
    // we won't be checking for existing images as this is not our responsibility
    //download the image and save it to the DB
    const image = await imageService.downloadImageFromUrl(imageUrl, null, true);

    ImportProductPhotosService.fileLogger.info(`Downloaded Image ${image.url} and saved to DB as ${image.imageId}`, {method: 'handlePhoto', imageId: image.imageId});

    const {key, value} = extractSingleFilterFromObject(item.itemFilter);
    const queryResult = await new BaseNeoService().neo.readWithCleanUp(`
    MATCH(n:${item.model} {${key}:'${value}'}) return n.uuid as id
    `, {});

    const id = queryResult[0].id

     await imageService.linkToObject({uuid: image.imageId}, item.model, id, item.type || 'main', {fromImport: true});
    return image;

  }
}
