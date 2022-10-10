import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UploaderQueueService } from "~root/upload/uploader-queue.service";
import { Job } from "bullmq";
import { CacheService } from "~shared/services/cache.service";
import { isImage } from "~root/upload/is-image";
import { ImageService } from "~image/image.service";

export interface IFileUploadMetaData {
  module: string;
  type: 'file'|'image';
  id?: string;
}

export interface IUploadJobData {
  type: 'single'|'multiple';
  file: Express.Multer.File;
  metaData: IFileUploadMetaData;
}

export interface IUploadJob extends Job {
  data: IUploadJobData;
}

export interface IFileUploadHandlerResult {
  url: string;
  id: string
}

@Injectable()
export class UploaderService {
  private static readonly logger = new Logger(UploaderService.name);
  public static onUploadDoneEventName = 'uploader.upload.complete';
  public static onUploadErrorEventName = 'uploader.upload.error';
  public static jobEventName = 'upload:process';
  protected static readonly uploadResultCacheKey = `upload-job-`;
  protected emitter: EventEmitter2;
  protected cache: CacheService;

  constructor() {
    this.emitter = new EventEmitter2();
    this.cache = new CacheService();
  }

  async onApplicationBootstrap() {
    UploaderQueueService.addWorker(this.processUpload);
  }

  async processUpload(job: IUploadJob) {
    const service = new UploaderService();
    const res = await service.singleUploadWorker(job.data.file, job.data.metaData);

    // write an entry to REDIS with this jobId as a key so that we can pickup the result
    try {
      await service.cache.put(`${UploaderService.uploadResultCacheKey}${job.id}`, res, 600);
    }
    catch (e) {
      console.log('Error 507', e)
    }
  }

  async multiple(files: Array<Express.Multer.File>) {
    for (let i = 0; files.length > i; i++) {
      // await this.handle(files[i], {});
    }

  }

  async singleUploadWorker(file: Express.Multer.File, metaData: IFileUploadMetaData): Promise<IFileUploadHandlerResult> {
    console.log(file)
    if (metaData && typeof metaData === 'string') {
      metaData = JSON.parse(metaData);
    }
    let result;
    // file uploaded, handle any db stuff elsewhere
    this.emitter.emit(UploaderService.onUploadDoneEventName, {file, metaData});
    // Handle it as an image
    let url;
    if (isImage(file.originalname)) {
      result = await this.handleImage(file, metaData);
    }
    // Handle it as a plain file
    else {
      result = await this.handleFile(file, metaData);
    }
    // Save it to the DB to get an ID back
    // if it is an image, check if it needs to be uploaded to the cloud
    //respond with the file data

    return result;
  }

  async getProcessFileFromResult(jobId: number) {
    return await this.cache.get(`${UploaderService.uploadResultCacheKey}${jobId}`);
  }

  private async handleImage(file: Express.Multer.File, metaData: IFileUploadMetaData): Promise<IFileUploadHandlerResult> {
    const service = new ImageService();
    let res;
    try {
        res = await service.handle(file.path);
    }
    catch (e) {
      console.log('Handler error ', e)
    }


    if (metaData && metaData.id && metaData.module) {
      // Link this to the item
      await service.linkToObject({uuid: res.id}, metaData.module, metaData.id)
    }

    return res;


  }

  private async handleFile(file: Express.Multer.File, metaData: IFileUploadMetaData): Promise<IFileUploadHandlerResult> {
    return;
  }
}
