import { Controller, Post, UploadedFile, UseInterceptors, Body, Get, Param, Query } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportService } from "~catalogue/import/services/import.service";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import {resolve} from 'path';
import { stat } from "fs/promises";
import { ImportProductPhotosService } from "~catalogue/import/services/import-product-photos.service";
import { HttpService } from "@nestjs/axios";
import { IsNotEmpty } from "class-validator";
import { ImportTemplateService } from "~catalogue/import/services/import-template.service";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { capitalize } from "lodash";
import { BaseImportService } from "~catalogue/import/services/base-import.service";
import { ImportTemplateRegistry } from "~catalogue/import/decorators/import-template-registry.decorator";

export class AnalyzerQueryParamsDTO {
  template: string;
}

class ValidateUploadedFileDTO {
  @IsNotEmpty()
  template: string;
}

@Controller('api/import')
export class ImportController {

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateUploadedFile(@UploadedFile() file: Express.Multer.File,@Param('limit') limit = 10, @Query() queryParams: AnalyzerQueryParamsDTO ) {

    const container = ImportTemplateRegistry.get({id: queryParams.template});

    if (!container) {
      throw new Error(`Could not find container for ${queryParams.template}`);
    }


    const handler = new container.reference() as BaseImportService;

    const res = await handler.analyze(file);
    return {...res, file : { filename: file.filename, mimetype: file.mimetype }, fieldMap: handler.processor.getFieldMap(), ...{data: res.data.slice(0, 10)}};
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Push it to the worker
    const job = await ImportQueueService.queue.add(ImportService.jobEventName, file);

    return {success: true, id: job.id};
  }

  @Post('start')
  async start(@Body() file: Express.Multer.File) {
    // On the upload we're missing the path for security reasons. Let's find the file based on the filename
    const dest = resolve(require('path').resolve('./'), './upload');
    file.path = resolve(dest,file.filename);

    // Push it to the worker
    const job = await ImportQueueService.queue.add(ImportService.jobEventName, file);
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
}
