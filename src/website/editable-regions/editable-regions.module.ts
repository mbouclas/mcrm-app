import { Module } from '@nestjs/common';
import { EditableRegionsService } from './editable-regions.service';
import { EditableRegionModel } from "~website/editable-regions/editable-region.model";
import { SharedModule } from "~shared/shared.module";
import { ModelRestructureService } from "~website/editable-regions/model-restructure.service";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    EditableRegionsService,
    EditableRegionModel,
    ModelRestructureService,
  ]
})
export class EditableRegionsModule {}
