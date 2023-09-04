import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { sortBy } from 'lodash';

const modelName = 'Page';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PageModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public title: string;
  public slug;

  async onModuleInit() { }

  public static displayedColumns = ['title', 'category'];

  public static modelConfig: INeo4jModel = {
    select: 'page:Page',
    as: 'page',
    relationships: {
      pageCategory: {
        model: 'PageCategory',
        modelAlias: 'pageCategory',
        alias: 'pageCategoryRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CATEGORY',
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
        postProcessing: async (record: Record<any, any>, model: PageModel) => {
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
      images: {
        rel: 'HAS_IMAGE',
        alias: 'imagesRelationship',
        model: 'Image',
        modelAlias: 'images',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        defaultProperty: 'name',
        postProcessing: async (record: Record<any, any>, model: PageModel) => {
          if (!record.images || !Array.isArray(record.images) || record.images.length === 0) {
            return record;
          }

          record.images = record.images
            .filter((image) => image.relationship && image.relationship.type !== 'main')
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

          record.images = sortBy(record.images, 'order');
          return record;
        },
      },
      categoryFilter: {
        rel: 'HAS_CATEGORY',
        alias: 'categoryFilterRelationship',
        model: 'pageCategory',
        modelAlias: 'categoryFilter',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      owner: {
        rel: 'IS_OWNER',
        alias: 'ownerRelationship',
        model: 'User',
        modelAlias: 'owner',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
      },
      tags: {
        rel: 'HAS_TAGS',
        alias: 'tagRelationship',
        model: 'Tag',
        modelAlias: 'tag',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        sortableCountDefaultAlias: 'tag',
        defaultProperty: 'name',
      },
      tag: {
        rel: 'HAS_TAGS',
        alias: 'tagRelationship',
        model: 'Tag',
        modelAlias: 'tag',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      tagCount: {
        rel: 'HAS_TAGS',
        alias: 'tagCountRelationship',
        model: 'Tag',
        modelAlias: 'tagCount',
        type: 'normal',
        isCollection: false,
        isCount: true,
      },
      related: {
        rel: 'IS_RELATED_TO',
        alias: 'relatedRelationship',
        model: 'Product',
        modelAlias: 'related',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'title',
      },
      extraField: {
        rel: 'HAS_EXTRA_FIELD',
        alias: 'extraFieldRelationship',
        model: 'ExtraField',
        modelAlias: 'extraField',
        type: 'normal',
        isCollection: true,
      },
      creator: {
        rel: 'HAS_CREATED',
        alias: 'creatorRelationship',
        model: 'User',
        modelAlias: 'creator',
        type: 'inverse',
        isCollection: false,
        defaultProperty: 'firstName.lastName',
      },
      editor: {
        rel: 'HAS_EDITED',
        alias: 'editorRelationship',
        model: 'User',
        modelAlias: 'editor',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
        addRelationshipData: true,
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
      varName: 'thumb',
      label: 'Thumbnail',
      placeholder: 'Thumbnail',
      type: 'image',
      imageSettings: {
        multiple: true,
        accept: 'image/*',
        addFromUrl: true,
        selectFromMediaLibrary: true,
        showPreview: true,
        width: 250,
        height: 250,
        defaultCopy: 'thumb',
        maxFileSize: 5000,
        fileLimit: 5,
        quality: 70,
      },
      group: 'right',
      groupIndex: 3,
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
      varName: 'updatedAt',
      label: 'Updated At',
      placeholder: 'Updated At',
      type: 'date',
      isSortable: true,
      group: 'hidden',
    },
    {
      varName: 'fromImport',
      label: 'fromImport',
      placeholder: 'fromImport',
      type: 'boolean',
      group: 'hidden',
      default: false,
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

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'Page',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'active',
      label: 'Active',
      type: 'boolean',
      model: 'Page',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'category',
      filterField: 'uuid',
      label: 'Category',
      type: 'string',
      relName: 'categoriesFilterRel',
      relType: 'inverse',
      model: 'PageCategory',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Page',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'createdAtFrom',
      rangeToFieldName: 'createdAtTo',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
