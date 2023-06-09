import { BaseTreeModel } from "~models/generic.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
const modelName = 'Menu';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class MenuModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public children: MenuModel[] = [];
  public parents: MenuModel[] = [];

  public static modelConfig: INeo4jModel = {
    select: 'menu:Menu',
    as: 'menu',
    relationships: {
      items: {
        rel: 'HAS_MENU_ITEM',
        alias: 'menuItemRelationship',
        model: 'MenuItem',
        modelAlias: 'menuItem',
        type: 'inverse',
        isCollection: true,
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
  ];
}
