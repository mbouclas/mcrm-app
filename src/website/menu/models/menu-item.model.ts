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

      required: true,
      group: 'main',
    },
    {
      varName: 'url',
      label: 'Url',
      placeholder: 'Url',
      type: 'text',
      required: true,
      group: 'main',
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      type: 'text',
      slugFrom: 'title',
      group: 'main',
    },
    {
      varName: 'link',
      label: 'Link',
      placeholder: 'Link',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'permalink',
      label: 'Permalink',
      placeholder: 'Permalink',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'model',
      label: 'Model',
      placeholder: 'Model',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'metaData',
      label: 'Meta Data',
      placeholder: 'Meta Data',
      type: 'json',
      translatable: false,
      group: 'main',
    },
    {
      varName: 'order',
      label: 'Order',
      placeholder: 'Order',
      type: 'number',
      translatable: false,
      group: 'main',
    },
  ];
}
