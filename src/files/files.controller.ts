import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { FilesService } from "~files/files.service";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { Readable } from 'stream';
import { Response } from 'express';

@Controller('api/files')
export class FilesController {
  @Get('get')
  async get(@Query('filename') filename: string, @Query('contents') contents: boolean = false) {
    const service = new FilesService();
    let result;
    try {
      result = await service.getFile({ filename }, contents);

    }
    catch (e) {
      return {success: false, error: e.message};
    }

    if (!contents) {
      return result;
    }

  }

  @Get('download/:bucket/:filename')
  async download(@Param('filename') filename: string, @Param('bucket') bucket: string) {
    const oss = new ObjectStorageService();
    return await oss.getObject(bucket, filename);
  }
}
