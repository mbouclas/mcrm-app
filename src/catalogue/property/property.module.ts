import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PropertyModel } from "~catalogue/property/property.model";
import { PropertyService } from './property.service';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    PropertyModel,
    PropertyService,
    ]
})
export class PropertyModule {}
