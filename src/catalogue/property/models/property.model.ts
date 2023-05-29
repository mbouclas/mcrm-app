import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { PropertyValueModel } from './property-value.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

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
      propertyValues: {
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
}
