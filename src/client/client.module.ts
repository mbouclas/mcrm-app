import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { SharedModule } from "~shared/shared.module";
import { MulterModule } from "@nestjs/platform-express";
import { extname, resolve } from "path";
import { diskStorage } from "multer";
import { uuid } from "uuidv4";
import { LatestProductsExecutor } from "~root/client/executors/latest-products.executor";
import { CustomerNotificationsExecutor } from "~root/client/executors/customer-notifications.executor";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ModuleRef } from "@nestjs/core";
import { BaseClientService } from "~root/client/services/base-client.service";
import { OrderHooks } from "~root/client/hooks/order.hooks";
import { UserHooks } from "~root/client/hooks/user.hooks";

@Module({
  providers: [
    LatestProductsExecutor,
    CustomerNotificationsExecutor,
    BaseClientService,
    OrderHooks,
    UserHooks,
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
            cb(null, `${uuid()}${extname(file.originalname)}`);
          }
        })
        // dest: resolve(require('path').resolve('./'), './upload'),
      })
    })
  ],
  controllers: [UploadController]
})
export class ClientModule {
  static eventEmitter: EventEmitter2;
  static moduleRef: ModuleRef;

  constructor(
    private m: ModuleRef,
    private eventEmitter: EventEmitter2,
  ) {
    ClientModule.eventEmitter = eventEmitter;
  }


  onModuleInit(): any {
    ClientModule.moduleRef = this.m;
  }

  static getService(service: any) {
    return ClientModule.moduleRef.get(service);
  }
}
