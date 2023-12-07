import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Query,
  HttpException
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportService } from "~catalogue/import/services/import.service";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import {resolve} from 'path';
import { ImportProductPhotosService } from "~catalogue/import/services/import-product-photos.service";
import { HttpService } from "@nestjs/axios";
import { IsNotEmpty } from "class-validator";
import { BaseImportService } from "~catalogue/import/services/base-import.service";
import { ImportTemplateRegistry } from "~catalogue/import/decorators/import-template-registry.decorator";
import { HttpImportException } from "~catalogue/import/exceptions/http-import.exception";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IGenericObject } from "~models/general";

export class AnalyzerQueryParamsDTO {
  template: string;
}

class ValidateUploadedFileDTO {
  @IsNotEmpty()
  template: string;
}

export interface IFileUploadMetaData {
  module: string;
  type: 'file'|'image';
  id?: string;
  data?: IGenericObject;
}

class FileUploadDto {
  metaData: string;
}

@Controller('api/import')
export class ImportController {
  async onApplicationBootstrap() {
/*    setTimeout(async () => {
      try {
        // await (new BaseNeoService().neo.backupDb())
        await (new BaseNeoService().neo.clearDb())
      }
      catch (e) {
        console.log('-=======', e)
      }
    }, 1000);*/

/*    setTimeout(async () => {
      const data = {"file":{"filename":"f5040211d0d2effa522c9ab11cba5a10","mimetype":"text/csv","settings":{},"path":"I:\\Work\\mcms-node\\mcrm\\upload\\f5040211d0d2effa522c9ab11cba5a10"},"template":"UpdateProductStatusTemplate","handler":{"jobEventName":"importJob","fieldMap":[{"name":"sku","importFieldName":"sku","required":true,"type":"sku","description":"The SKU of the product to update"},{"name":"active","importFieldName":"active","required":false,"type":"boolean","description":"The new active status of the product. true = active, false = inactive"}],"processor":{"fieldMap":[{"name":"sku","importFieldName":"sku","required":true,"type":"sku","description":"The SKU of the product to update"},{"name":"active","importFieldName":"active","required":false,"type":"boolean","description":"The new active status of the product. true = active, false = inactive"}],"results":[],"invalidRows":[]},"settings":{}},"settings":{}};
      const template = 'UpdateProductStatusTemplate';
      const container = ImportTemplateRegistry.get({id: template});
      const settings = {}

      const handler = new container.reference(settings) as BaseImportService;
      const job = await ImportQueueService.queue.add(handler.jobEventName, { file: data.file, template, handler, settings });
      console.log(job.id)
    }, 1000);*/
  }

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateUploadedFile(@UploadedFile() file: Express.Multer.File,@Query('limit') limit = 10, @Query() queryParams: AnalyzerQueryParamsDTO, @Body() body: FileUploadDto ) {
    let metaData: IFileUploadMetaData;
    try {
      metaData = JSON.parse(body.metaData);
    }
    catch (e) {}

    const settings: IGenericObject = metaData?.data?.settings || {};

    const container = ImportTemplateRegistry.get({id: queryParams.template});

    if (!container) {
      throw new Error(`Could not find container for ${queryParams.template}`);
    }


    const handler = new container.reference({ settings }) as BaseImportService;

    const res = await handler.analyze(file);
    res.data = res.data.slice(0, limit);
    if (res.invalidRows.length > 50) {
      res['invalidRowsCount'] = res.invalidRows.length;
      res.invalidRows = res.invalidRows.slice(0, 50);
    }
    return {...res, file : { filename: file.filename, mimetype: file.mimetype }, fieldMap: handler.processor.getFieldMap(), ...{data: res.data}};
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Push it to the worker
    const job = await ImportQueueService.queue.add(ImportService.jobEventName, file);

    return {success: true, id: job.id};
  }

  @Post('start')
  async start(@Body() file: Express.Multer.File, @Query('template') template: string, @Query('immediate') immediateExecution = false, @Body() body: {settings?: IGenericObject}) {

    // On the upload we're missing the path for security reasons. Let's find the file based on the filename
    const dest = resolve(require('path').resolve('./'), './upload');
    file.path = resolve(dest,file.filename);
    // convert immediate to boolean
    immediateExecution = (typeof immediateExecution === 'string') ? immediateExecution === 'true' : immediateExecution;
    const container = ImportTemplateRegistry.get({id: template});

    if (!container) {
      throw new Error(`Could not find container for ${template}`);
    }

    const settings = typeof body.settings === 'object' ? body.settings : {};


    const handler = new container.reference(settings) as BaseImportService;

    try {
      await handler.backupDb();
    }
    catch (e) {
      throw new HttpImportException({
        error: e.message,
        code: e.getCode(),
        statusCode: 500,
        reason: e.message,
      });
    }

    if (immediateExecution) {
      try {
        return await handler.process(file);
      }
      catch (e) {
        throw new HttpImportException({
          error: e.message,
          code: e.getCode(),
          statusCode: 500,
          reason: e.message,
        });
      }
    }


    // Push it to the worker
    const job = await ImportQueueService.queue.add(handler.jobEventName, { file, template, handler, settings });
    return {success: true, jobId: job.id};
  }

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeUploadedFile(@UploadedFile() file: Express.Multer.File,@Param('limit') limit = 10, @Query() queryParams: AnalyzerQueryParamsDTO) {
    if (queryParams.template) {
      //Get the template and load it into the import service
    }


    const res = await (new ImportService()).analyzeFile(file, limit);

    return {...res, file : { filename: file.filename, mimetype: file.mimetype }};
  }

  /**
   * Get a CSV file with product photos and analyze it
   * @param file
   * @param limit
   * @param queryParams
   */
  @Post('photos/analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzePhotos(@UploadedFile() file: Express.Multer.File,@Param('limit') limit = 10, @Query() queryParams: AnalyzerQueryParamsDTO) {
    const res = await (new ImportProductPhotosService(new HttpService())).analyze(file, limit);
    return res;
  }

  @Post('photos/start')
  async startPhotosImport(@Body() file: Express.Multer.File) {
    // On the upload we're missing the path for security reasons. Let's find the file based on the filename
    const dest = resolve(require('path').resolve('./'), './upload');
    file.path = resolve(dest,file.filename);

    // Push it to the worker
    const job = await ImportQueueService.photosImportQueue.add(ImportProductPhotosService.jobEventName, file);
    return {success: true, jobId: job.id};

    // return await (new ImportProductPhotosService()).processFile(file);
  }

  @Get('progress/:id')
  async getImportProgress(@Param('id') jobId: string) {
    return (new ImportService()).getImportResult(parseInt(jobId));
  }

  /**
   * get the progress of a particular job
   * @param jobId
   */
  @Get('progress/image/:id')
  async getImageProcessingProgress(@Param('id') jobId: string) {
    const job = await ImportQueueService.imageProcessingQueue.getJob(jobId);
    try {
      return await job.getState();
    }
    catch (e) {
      console.log(`Error getting state ${jobId}`)
      return {success: false, error: e.message}
    }

  }

  @Get('progress/photos-import/:id')
  async getPhotosImportProgress(@Param('id') jobId: string) {
    const job = await ImportQueueService.photosImportQueue.getJob(jobId);
    try {
      return await job.getState();
    }
    catch (e) {
      console.log(`Error getting state ${jobId}`);
      return {success: false, error: e.message}
    }

  }

  @Post('backup')
  async backupDb() {
    try {
      return await (new BaseNeoService().neo.backupDb());
    }
    catch (e) {
      console.log(`Error backing up database`, e);
      throw new HttpException(`Error backing up database`, 500);
    }
  }
}
