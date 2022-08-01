import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PageModule } from "~cms/page/page.module";


@Module({
  imports: [
    SharedModule,
    PageModule,
  ]
})
export class CmsModule {}
