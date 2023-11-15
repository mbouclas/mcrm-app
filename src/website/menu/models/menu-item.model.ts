import { BaseTreeModel } from "~models/generic.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { McrmModel } from "~neo4j/neo4j.decorators";
import { IGenericObject } from "~models/general";
import { object } from "yup";
import { z } from "zod";

const schema = z.object({
  title: z.string({required_error: 'Title is required', invalid_type_error: 'Title must be a string'}).min(1, 'Title is required'),
  description: z.string({invalid_type_error: 'Description must be a string'}).optional(),
  caption: z.string({ invalid_type_error: 'Caption must be a string'}).optional(),
});

@McrmModel('MenuItem')
@Injectable()
export class MenuItemModel extends BaseTreeModel {
  public children: MenuItemModel[] = [];
  public parents: MenuItemModel[] = [];
  public static validationSchema = schema;

  public static modelConfig: INeo4jModel = {
    select: 'menuItem:MenuItem',
    as: 'menuItem',
    relationships: {
      menu: {
        rel: 'HAS_CHILD',
        alias: 'menuRelationship',
        model: 'Menu',
        modelAlias: 'menu',
        type: 'inverse',
        isCollection: true,
      },
      parent: {
        rel: 'HAS_CHILD',
        alias: 'MenuRelationship',
        model: 'MenuItem',
        modelAlias: 'MenuItemParent',
        type: 'inverse',
        isCollection: false,
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
      varName: 'type',
      label: 'Menu Item Type',
      placeholder: 'Menu Item Type',
      type: 'select',
      options: [
        {
          label: 'Custom',
          value: 'custom',
          default: true,
        },
        {
          label: 'Object',
          value: 'object',
        }
      ],
      required: true,
      group: 'hidden',
    },
    {
      varName: 'target',
      label: 'Link opens in',
      placeholder: 'Link opens in',
      type: 'select',
      options: [
        {
          label: 'Same Tab',
          value: '_self',
          default: true,
        },
        {
          label: 'New Tab',
          value: '_blank',
        }
      ],
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'caption',
      label: 'Caption',
      placeholder: 'Caption',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      type: 'text',
      slugFrom: 'title',
      isSlug: true,
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
      type: 'nested',
      group: 'main',
      required: false,
      saveAsJson: true,
      fields: [
        {
          varName: 'cta',
          label: 'CTA',
          placeholder: 'CTA',
          type: 'nested',
          fields: [
            {
              varName: 'title',
              label: 'Title',
              placeholder: 'Title',
              type: 'text',
            },
            {
              varName: 'subtitle',
              label: 'Sub Title',
              placeholder: 'Sub Title',
              type: 'text',
            },
            {
              varName: 'url',
              label: 'Url',
              placeholder: 'Url',
              type: 'text',
            },
            {
              varName: 'image',
              label: 'Image',
              placeholder: 'Image',
              type: 'image',
            },
          ],
        }
      ],
    },
    {
      varName: 'order',
      label: 'Order',
      placeholder: 'Order',
      type: 'number',
      group: 'main',
    },
  ];


}
