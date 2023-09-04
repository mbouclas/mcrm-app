import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

const modelName = 'PageCategory';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PageCategoryModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public children: PageCategoryModel[] = [];
  public parents: PageCategoryModel[] = [];

  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  public static modelConfig: INeo4jModel = {
    select: 'pageCategory:PageCategory',
    as: 'pageCategory',
    relationships: {
      page: {
        rel: 'HAS_CATEGORY',
        alias: 'pageCategoryRelationship',
        model: 'Page',
        modelAlias: 'page',
        type: 'inverse',
        isCollection: true,
      },
      parent: {
        rel: 'HAS_CHILD',
        alias: 'pageCategoryParentRelationship',
        model: 'PageCategory',
        modelAlias: 'pageCategoryParent',
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
      isSlug: true,
      group: 'main',
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'richText',
      group: 'main',
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
      varName: 'metaData',
      label: 'Meta Data',
      placeholder: 'Meta Data',
      type: 'json',
      group: 'main',
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
