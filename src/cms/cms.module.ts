import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { PageModule } from "~cms/page/page.module";
import { MenuModule } from './menu/menu.module';


@Module({
  imports: [
    SharedModule,
    PageModule,
    MenuModule,
  ]
})
export class CmsModule {}
