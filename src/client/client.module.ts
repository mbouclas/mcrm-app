import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { SharedModule } from "~shared/shared.module";
import { MulterModule } from "@nestjs/platform-express";
import { resolve } from "path";

@Module({
  imports: [
    SharedModule,
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: resolve(require('path').resolve('./'), './upload'),
      }),
    }),
  ],
  controllers: [UploadController]
})
export class ClientModule {}
