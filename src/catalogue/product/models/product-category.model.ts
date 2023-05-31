import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

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
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      translatable: true,
      group: 'main',
    },
  ];
}
