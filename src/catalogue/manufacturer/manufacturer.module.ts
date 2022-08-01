import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { ManufacturerModel } from "~catalogue/manufacturer/manufacturer.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ManufacturerModel,
  ]
})
export class ManufacturerModule {}
