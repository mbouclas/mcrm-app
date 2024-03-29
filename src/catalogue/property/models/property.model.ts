import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { PropertyValueModel } from './property-value.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~root/shared/models/queryBuilder';

const modelName = 'Property';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PropertyModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'property:Property',
    as: 'property',
    relationships: {
      propertyValue: {
        rel: 'HAS_VALUE',
        alias: 'propertyValueRelationship',
        model: 'PropertyValue',
        modelAlias: 'propertyValue',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        tabs: ['General'],
        sortableCountDefaultAlias: 'propertyValue',
        defaultProperty: 'name',
        fields: PropertyValueModel.fields.map((field) => ({
          ...field,
          updateRules: {},
        })),
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
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
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'type',
      label: 'Type',
      placeholder: 'Type',
      type: 'text',
      ui: {
        component: 'DropDown',
        defaultValues: ['text', 'color'],
      },
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      type: 'boolean',
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
    {
      varName: 'searchIndexSettings',
      label: 'Search Index Settings',
      placeholder: 'Search Index Settings',
      type: 'textarea',
      isSortable: false,
      group: 'main',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'Property',
      filterType: 'partial',
      isInSimpleQuery: true,
    },

    {
      varName: 'description',
      label: 'Description',
      type: 'text',
      model: 'Property',
      filterType: 'partial',
      isInSimpleQuery: true,
    },

    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Property',
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
