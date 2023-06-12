import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";



@Module({
  imports: [
    SharedModule
  ],
  providers: [

  ],
  exports: [

  ],
  controllers: [],
})
export class ObjectStorageModule {}
