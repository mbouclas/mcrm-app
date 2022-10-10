import { Module } from '@nestjs/common';
import { FileUploaderController } from './file-uploader.controller';
import { UploaderService } from './uploader.service';
import { MulterModule } from "@nestjs/platform-express";
import { join, resolve } from "path";
import { UploaderQueueService } from './uploader-queue.service';
import { diskStorage } from "multer";

@Module({
  controllers: [FileUploaderController],
  providers: [UploaderService, UploaderQueueService],
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: resolve(require('path').resolve('./'), './upload'),
        storage: diskStorage({
          destination: (req, file, cb) => {
            cb(null, resolve(require('path').resolve('./'), './upload'));
          },
          filename: (req, file, cb) => {
            cb(null, file.originalname)
          }
        })
      }),
    }),
  ]
})
export class UploadModule {}
