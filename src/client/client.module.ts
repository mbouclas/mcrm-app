import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { SharedModule } from "~shared/shared.module";
import { MulterModule } from "@nestjs/platform-express";
import { extname, resolve } from "path";
import { diskStorage } from "multer";
import { uuid } from "uuidv4";
import { LatestProductsExecutor } from "~root/client/executors/latest-products.executor";

@Module({
  providers: [
    LatestProductsExecutor
  ],
  imports: [
    SharedModule,
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
            console.log(file)
            cb( null, `${uuid()}${extname(file.originalname)}`);
          }
        })
        // dest: resolve(require('path').resolve('./'), './upload'),
      })
    })
  ],
  controllers: [UploadController]
})
export class ClientModule {
}
