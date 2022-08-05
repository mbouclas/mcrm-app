import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PropertyModel } from "~catalogue/property/property.model";
import { PropertyService } from './property.service';
import { PropertyValueModel } from "~catalogue/property/property-value.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    PropertyModel,
    PropertyValueModel,
    PropertyService,
    ]
})
export class PropertyModule {}
