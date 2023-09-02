import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

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

  async onModuleInit() {}

  public static displayedColumns = ['title', 'category'];

  public static modelConfig: INeo4jModel = {
    select: 'page:Page',
    as: 'page',
    relationships: {
      category: {
        model: 'PageCategory',
        modelAlias: 'pageCategory',
        alias: 'pageCategoryRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CATEGORY',
      },
      image: {
        model: 'Image',
        modelAlias: 'image',
        alias: 'imageRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_IMAGE',
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
        model: 'page',
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
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
