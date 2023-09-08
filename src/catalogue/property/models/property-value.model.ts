import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';

import { IDynamicFieldConfigBlueprint, IDynamicFieldParamConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~root/shared/models/queryBuilder';

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
    select: 'propertyValue:PropertyValue',
    as: 'propertyValue',
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
      slugFrom: 'name',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Order',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'createdAtFrom',
      rangeToFieldName: 'createdAtTo',
      isInSimpleQuery: false,
    },

    {
      varName: 'property',
      filterField: 'uuid',
      label: 'Proprty',
      type: 'string',
      relName: 'propertyFilterRel',
      relType: 'inverse',
      model: 'Property',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];
}
