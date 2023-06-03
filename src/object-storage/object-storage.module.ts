import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";

@Module({
  imports: [
    SharedModule
  ],
  providers: [

  ],
  exports: [

  ],
})
export class ObjectStorageModule {}
