import { Module } from '@nestjs/common';
import { FileUploaderController } from './file-uploader.controller';
import { UploaderService } from './uploader.service';
import { MulterModule } from "@nestjs/platform-express";
import { extname, join, resolve } from "path";
import { UploaderQueueService } from './uploader-queue.service';
import { diskStorage } from "multer";
import { uuid } from "uuidv4";
const uploadDir = resolve(require('path').resolve('./'), './upload');
@Module({
  controllers: [FileUploaderController],
  providers: [UploaderService, UploaderQueueService],
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        fileFilter: (req, file, cb) => {
          file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
          file.filename = `${file.filename}${extname(file.originalname)}`;
          cb(null, true);
        },
        storage: diskStorage({
          destination: resolve(require("path").resolve("./"), "./upload"),
          filename: (req, file, cb) => {
            cb(null, `${uuid()}${extname(file.originalname)}`);
          }
        })
      }),
    }),
  ]
})
export class UploadModule {
  static uploadDir = `${uploadDir}/`;
}
