import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { MenuItemService } from "~website/menu/menu-item.service";
import { MenuItemModel } from "~website/menu/models/menu-item.model";
import { FailedMove, NotFound } from "~catalogue/product/exceptions/productCategoryExceptions";
import BaseHttpException from "~shared/exceptions/base-http-exception";
import { IGenericObject } from "~models/general";
import { TreeDeleteType } from "~shared/services/base-neo-tree.service";


@Controller('api/menu-item')
export class MenuItemController {

  @Get('tree')
  async tree(@Query('menuId') menuId: string) {
    try {
      return await new MenuItemService().getMenuItemsTree({uuid: menuId});
    } catch (e) {
      console.log(e)
      throw new BaseHttpException({
        statusCode: 500,
        reason: 'Failed to get menu tree',
        error: e,
        code: 'menu-item-001'
      });
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    return await new MenuItemService().findOne({uuid}, ['*']);
  }

  @Post()
  async store(@Body() body: {menuId: string, item: Partial<MenuItemModel>}) {
    let rels = [];

    if (body.item['parentUuid']) {
      rels = [
        {
          id: body.item['parentUuid'],
          name: 'parent',
        },
      ];
    }

    const service = new MenuItemService();
    const res = await service.storeAndLinkToMenu(body.menuId, body.item, rels);

    return {
      tree: await this.tree(body.menuId),
      item: res
    };
  }

  @Patch('save-order')
  async saveOrder(@Body() body: Partial<MenuItemModel>[]) {
    try {
      await new MenuItemService().saveOrder(body);
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        code: e.getCode(),
        statusCode: 500,
        error: e,
        reason: `Could not save order`
      })
    }


    return {success: true};
  }

  @Patch(':uuid')
  async update(@Param('uuid') uuid: string, @Body() body: Partial<MenuItemModel>) {
    return await new MenuItemService().update(uuid, body);
  }

  @Delete(':uuid')
  async delete(@Param("uuid") uuid: string, @Query("menuId") menuId: string, @Query("deleteType") deleteType: TreeDeleteType) {
    try {
      const type = TreeDeleteType[deleteType as keyof typeof TreeDeleteType];
      await new MenuItemService().deleteNode(uuid, type);

      return await new MenuItemService().getMenuItemsTree({uuid: menuId});
    } catch (e) {

    }

  }

  @Patch(`:id/move`)
  async move(@Param('id') uuid: string, @Body() body: Partial<MenuItemModel>, @Query('menuId') menuId: string) {
    try {
      const parentFilter = body['newParentUuid'] ? { uuid: body['newParentUuid'] } : null;

      await new MenuItemService().moveNode(
        {
          uuid,
        },
        parentFilter,
      );

      return await new MenuItemService().getMenuItemsTree({uuid: menuId});
    } catch (e) {
      throw new FailedMove();
    }
  }

  @Post('add-children')
  async addChildren(@Body() body: {menuId: string, item: Partial<MenuItemModel>, modelName: string}) {
    try {
      const res = await new MenuItemService().addMenuItemChildren(body.menuId, body.item, body.modelName);
      return {
        tree: await this.tree(body.menuId),
        item: res
      };
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        code: e.getCode(),
        statusCode: 500,
        error: e,
        reason: e.getMessage()
      })
    }
  }

  @Post('to-menu-item/:model')
  async toMenuItem(@Param('model') modelName: string, @Body() body: IGenericObject) {
    try {
      return await new MenuItemService().toMenuItem(modelName, body, body.type || undefined);
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        code: e.getCode(),
        statusCode: 500,
        error: e,
        reason: e.getMessage()
      })
    }
  }


}
