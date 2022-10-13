import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";

import { PageModel } from './models/page.model';
import { PageCategoryModel } from "~cms/page/models/page-category.model";

import { PageController } from './controllers/page.controller';
import { PageCategoryController } from './controllers/page-category.controller';

import { PageService } from './services/page.service';
import { PageCategoryService } from './services/page-category.service';

@Module({
  imports: [
    SharedModule,
    PageModule,
  ],
  providers: [
    PageModel,
    PageCategoryModel,
    PageCategoryService,
    PageService,
  ],
  controllers: [PageController, PageCategoryController]
})

export class PageModule {}
