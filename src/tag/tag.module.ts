import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { TagService } from "~tag/services/tag.service";
import { TagModel } from "~tag/tag.model";
import { TagController } from './tag.controller';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    TagService,
    TagModel,
  ],
  controllers: [TagController]
})
export class TagModule {}
