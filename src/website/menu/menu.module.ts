import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuItemService } from "~website/menu/menu-item.service";
import { MenuModel } from "~website/menu/models/menu.model";
import { MenuItemModel } from "~website/menu/models/menu-item.model";

@Module({
  providers: [
    MenuItemService,
    MenuModel,
    MenuItemModel,
  ],
  controllers: [MenuController]
})
export class MenuModule {}
