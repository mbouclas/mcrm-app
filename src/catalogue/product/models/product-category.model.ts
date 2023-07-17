import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { getStoreProperty } from '~root/state';

const modelName = 'ProductCategory';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ProductCategoryModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public children: ProductCategoryModel[] = [];
  public parents: ProductCategoryModel[] = [];

  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  public static modelConfig: INeo4jModel = {
    select: 'productCategory:ProductCategory',
    as: 'productCategory',
    relationships: {
      product: {
        rel: 'HAS_CATEGORY',
        alias: 'productCategoryRelationship',
        model: 'Product',
        modelAlias: 'product',
        type: 'inverse',
        isCollection: true,
      },
      parent: {
        rel: 'HAS_CHILD',
        alias: 'productCategoryParentRelationship',
        model: 'ProductCategory',
        modelAlias: 'productCategory',
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
      type: 'text',
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
  ];
}
