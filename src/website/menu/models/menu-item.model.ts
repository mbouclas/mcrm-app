import { BaseTreeModel } from "~models/generic.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

const modelName = 'MenuItem';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class MenuItemModel extends BaseTreeModel {
  public modelName = modelName;
  public static modelName = modelName;
  public children: MenuItemModel[] = [];
  public parents: MenuItemModel[] = [];

  public static modelConfig: INeo4jModel = {
    select: 'menuItem:MenuItem',
    as: 'menuItem',
    relationships: {
      menu: {
        rel: 'HAS_ITEM',
        alias: 'menuRelationship',
        model: 'Menu',
        modelAlias: 'menu',
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
      varName: 'url',
      label: 'Url',
      placeholder: 'Url',
      type: 'text',
      translatable: true,
      required: true,
      setDefaultTranslationInModel: true,
      isSlug: true,
      group: 'main',
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
