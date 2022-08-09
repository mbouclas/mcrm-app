import { Controller, Post, UploadedFile, UseInterceptors, Body } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportService } from "~catalogue/import/services/import.service";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";

@Controller('api/import')
export class ImportController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Push it to the worker
    await ImportQueueService.queue.add(ImportService.jobEventName, file)
    console.log(JSON.stringify(file))
    return {success: true};
  }

  @Post('analyze')
  async analyzeUploadedFile(@Body() file: Express.Multer.File) {
    return await (new ImportService()).processFile(file);
  }

}
