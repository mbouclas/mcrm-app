import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { FileEventNames, FilesService } from "~files/files.service";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { Readable } from 'stream';
import { Response } from 'express';
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { SharedModule } from "~shared/shared.module";
import { resolve } from "path";

@Controller('api/files')
export class FilesController {
  onApplicationBootstrap() {
/*    setTimeout(async () => {
      const oss = new ObjectStorageService();
      await oss.getObject('quotes', 'd0ce3b04-c237-47cd-af3f-f2381b66a4d7.pdf')
    }, 1000)*/
  }

  @Get('stream')
  async stream(@Query('filename') filename: string,  @Res() res: Response) {
    const service = new FilesService();
    const file = resolve('upload/' + filename);
    await service.getFile({ filename }); //download a temp file
    const stats = await stat(file);
    const readStream = createReadStream(file);
    const mime = require('mime');
    res.setHeader('Content-Type', mime.getType(file));
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);


    readStream.on('end', () => {
      SharedModule.eventEmitter.emit(FileEventNames.FileDownloaded, file);
    });
    readStream.pipe(res);
  }

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
