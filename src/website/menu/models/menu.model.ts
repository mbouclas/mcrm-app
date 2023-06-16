import { BaseTreeModel } from "~models/generic.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { MenuItemModel } from "~website/menu/models/menu-item.model";
import { MenuItemService } from "~website/menu/menu-item.service";
import { sortBy } from "lodash";
const modelName = 'Menu';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class MenuModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;


  public static modelConfig: INeo4jModel = {
    select: 'menu:Menu',
    as: 'menu',
    relationships: {
      items: {
        rel: 'HAS_ITEM',
        alias: 'menuItemRelationship',
        model: 'MenuItem',
        modelAlias: 'menuItem',
        type: 'normal',
        isCollection: true,
      },
      itemTree: {
        rel: 'HAS_ITEM',
        alias: 'menuItemRelationship',
        model: 'MenuItem',
        modelAlias: 'menuItem',
        type: 'normal',
        isCollection: true,
        postProcessing: async (record: Record<any, any>, model: MenuItemModel) => {
          if (!Array.isArray(record.menuItem)) {
            return record;
          }

          const service = new MenuItemService();
          record.menuItem = sortBy(record.menuItem, 'order');
          // This query returns top level items only. Let's build a tree
          for (let idx = 0; idx < record.menuItem.length; idx++) {
            let item = record.menuItem[idx];
            if (!item['itemId']) {continue}

            record.menuItem[idx] = await service.getParentAndChildren(item.uuid);

          }

          return record;
        }
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      placeholder: 'Title',
      type: 'text',
      translatable: true,
      required: true,
      setDefaultTranslationInModel: true,
      isSlug: true,
      group: 'main',
    },
    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      type: 'text',
      group: 'hidden',
      isSlug: true,
      slugFrom: 'title',
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      translatable: true,
      group: 'main',
    },
    {
      varName: 'caption',
      label: 'Caption',
      placeholder: 'Caption',
      type: 'text',
      translatable: true,
      group: 'main',
    },
    {
      varName: 'metaData',
      label: 'Meta Data',
      placeholder: 'Meta Data',
      type: 'json',
      translatable: true,
      group: 'main',
    },
  ];
}
