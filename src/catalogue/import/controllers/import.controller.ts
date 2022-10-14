import { Controller, Post, UploadedFile, UseInterceptors, Body, Get, Param, Query } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportService } from "~catalogue/import/services/import.service";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import {resolve} from 'path';
import { stat } from "fs/promises";

export class AnalyzerQueryParamsDTO {
  template?: string;
}
@Controller('api/import')
export class ImportController {
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
  async analyzeUploadedFile(@UploadedFile() file: Express.Multer.File, @Query() queryParams: AnalyzerQueryParamsDTO = {}) {
    if (queryParams.template) {
      //Get the template and load it into the import service
    }


    const res = await (new ImportService()).analyzeFile(file);

    return {...res, file : { filename: file.filename, mimetype: file.mimetype }};
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
    return await job.getState();
  }
}
