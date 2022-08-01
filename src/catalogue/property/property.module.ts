import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PropertyModel } from "~catalogue/property/property.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    PropertyModel,
    ]
})
export class PropertyModule {}
