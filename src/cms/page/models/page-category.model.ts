import { Injectable } from '@nestjs/common';
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";


const modelName = 'PageCategory';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class PageCategoryModel extends BaseModel
{
  public modelName = modelName;
  public static modelName = modelName;
  public children: PageCategoryModel[] = [];

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
    }
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
      group: 'main'
    },
    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      type: 'text',
      group: 'hidden',
      isSlug: true,
      slugFrom: 'title'
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      translatable: true,
      group: 'main'
    },
  ];
}
