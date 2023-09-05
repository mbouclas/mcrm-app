import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

const modelName = 'Manufacturer';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ManufacturerModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'manufacturer:Manufacturer',
    as: 'manufacturer',
    relationships: {
      product: {
        rel: 'HAS_MANUFACTURER',
        alias: 'manufacturerRelationship',
        model: 'Product',
        modelAlias: 'product',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'id',
      },
      thumb: {
        rel: 'HAS_IMAGE',
        alias: 'thumbRelationship',
        model: 'Image',
        modelAlias: 'thumb',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        defaultProperty: 'name',
        postProcessing: async (record: Record<any, any>, model: ManufacturerModel) => {
          if (!record.thumb || !Array.isArray(record.thumb) || record.thumb.length === 0) {
            return record;
          }

          record.thumb = record.thumb
            .filter((image) => image.relationship && image.relationship.type === 'main')
            .map((image) => ({
              ...image.model,
              ...{
                type: image.relationship.type,
                order: image.relationship.order,
                title: image.relationship.title,
                description: image.relationship.description,
                alt: image.relationship.alt,
                caption: image.relationship.caption,
              },
            }));

          if (record.thumb.length === 0) {
            record.thumb = record.thumb[0];
          }

          return record;
        },
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      type: 'boolean',
      isSortable: true,
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },

    {
      varName: 'title',
      label: 'Title',
      placeholder: 'Title',
      type: 'text',
      isSortable: true,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
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
      type: 'richText',
      isSortable: false,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'description_long',
      label: 'Long Description',
      placeholder: 'Long Description',
      type: 'richText',
      isSortable: false,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },

    {
      varName: 'seo',
      label: 'Seo',
      placeholder: 'Seo',
      type: 'nested',
      group: 'seo',
      default: false,
      fields: [
        {
          varName: 'title',
          label: 'Title',
          placeholder: 'Title',
          type: 'string',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'description',
          label: 'Description',
          placeholder: 'Description',
          type: 'string',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'keywords',
          label: 'Keywords',
          placeholder: 'Keywords',
          type: 'string',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'og_title',
          label: 'Og:Title',
          placeholder: 'Oh:Title',
          type: 'string',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'og_image',
          label: 'Og:Image',
          placeholder: 'Og:Image',
          type: 'string',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'og_description',
          label: 'Og:Description',
          placeholder: 'Og:Description',
          type: 'string',
          group: 'hidden',
          default: false,
        },
      ],
    },
  ];
}
