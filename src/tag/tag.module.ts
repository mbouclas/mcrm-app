import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { TagService } from "~tag/services/tag.service";
import { TagModel } from "~tag/tag.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    TagService,
    TagModel,
  ]
})
export class TagModule {}
