import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuItemService } from "~website/menu/menu-item.service";
import { MenuModel } from "~website/menu/models/menu.model";
import { MenuItemModel } from "~website/menu/models/menu-item.model";
import { PermalinkBuilderService } from "~website/menu/permalink-builder.service";
import { MenuItemController } from './menu-item.controller';

@Module({
  providers: [
    MenuItemService,
    MenuModel,
    MenuItemModel,
    PermalinkBuilderService,
  ],
  controllers: [MenuController, MenuItemController]
})
export class MenuModule {}
