import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PageModel } from "~cms/page/models/page.model";
import { PageCategoryModel } from "~cms/page/models/page-category.model";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    PageModel,
    PageCategoryModel,
  ]
})
export class PageModule {}
