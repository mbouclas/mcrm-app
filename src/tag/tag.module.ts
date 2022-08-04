import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { TagService } from "~tag/services/tag.service";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    TagService,
  ]
})
export class TagModule {}
