import { Body, Controller, Get, Param, Post, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { IFileUploadMetaData, UploaderService } from "~root/upload/uploader.service";
import { UploaderQueueService } from "~root/upload/uploader-queue.service";
import { ImageService } from "~image/image.service";

class LinkUploadToItemDto {
  itemId: string;
  model: string;
  imageId: string;
  imageType: 'image'|'file';
}


@Controller('api/file-uploader')
export class FileUploaderController {

  constructor(
    protected service: UploaderService,
  ) {
  }

  @Post('multiple')
  @UseInterceptors(AnyFilesInterceptor())
  async upload(@UploadedFiles() files: Array<Express.Multer.File>) {
    // await this.service.multiple(files);

    return {success: true};
  }

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: {metaData: IFileUploadMetaData}) {
    // Push it to the worker
    const job = await UploaderQueueService.queue.add(UploaderService.jobEventName, {type: 'single', file, metaData: body.metaData});
    // will query back using this worker id
    return {success: true, jobId: job.id};
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files[]'))
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: IFileUploadMetaData) {
    const res = await this.service.multiple(files, body)

    return res;
  }


  @Get('status/:id')
  async getUploadStatus(@Param('id') jobId: string) {
    const res = await this.service.getProcessFileFromResult(parseInt(jobId));
    // console.log('Querying image worker status ',res, '----------')
    return !res ? null : res;
  }

  @Post('link')
  async linkUploadToItem(@Body() payload: LinkUploadToItemDto) {
    await (new ImageService).linkToObject({uuid: payload.imageId}, payload.model, payload.itemId, payload.imageType || 'main')
  }

}
