import { Module } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { MenuController } from './menu.controller';
import { MemuController } from './models/memu/memu.controller';
import { MenuModel } from "~cms/menu/models/menu.model";
import { MenuItemModel } from "~cms/menu/models/menu-item.model";

@Module({
  providers: [
    MenuItemService,
    MenuModel,
    MenuItemModel,
  ],
  controllers: [MenuController, MemuController]
})
export class MenuModule {}
