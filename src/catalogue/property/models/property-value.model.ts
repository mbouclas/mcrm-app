import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';

import { IDynamicFieldConfigBlueprint, IDynamicFieldParamConfigBlueprint } from '~admin/models/dynamicFields';

const modelName = 'PropertyValue';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PropertyValueModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'product:Product',
    as: 'product',
    relationships: {
      property: {
        model: 'Property',
        modelAlias: 'property',
        alias: 'propertyRelationship',
        type: 'inverse',
        isCollection: false,
        rel: 'HAS_VALUE',
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'type',
      label: 'Type',
      placeholder: 'Type',
      type: 'text',
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'icon',
      label: 'Icon',
      placeholder: 'Icon',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'image',
      label: 'Image',
      placeholder: 'Image',
      type: 'text',
      isSortable: true,
      group: 'main',
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
  ];
}
