import { Module } from '@nestjs/common';
import { FilesController } from "~files/files.controller";
import { SharedModule } from "~shared/shared.module";
import { FileModel } from "~files/models/file.model";
import { FilesService } from "~files/files.service";

@Module({
  imports: [
    SharedModule
  ],
  providers: [
    FileModel,
    FilesService,
  ],
  controllers: [
    FilesController
  ]
})
export class FilesModule {}
