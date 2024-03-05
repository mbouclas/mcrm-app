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
      varName: 'color',
      label: 'Color',
      placeholder: 'Color',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'code',
      label: 'Code',
      placeholder: 'Code',
      type: 'text',
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      isReadOnly: true,
      type: 'text',
      group: 'hidden',
      isSlug: true,
      slugFrom: 'name',
    },

    {
      varName: 'icon',
      label: 'Icon',
      placeholder: 'Icon',
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
    },

    {
      varName: 'image',
      label: 'Image',
      placeholder: 'Image',
      type: 'image',
      group: 'right',
      groupIndex: 3,
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
      varName: 'name',
      label: 'Name',
      type: 'text',
      model: 'PropertyValue',
      filterType: 'partial',
      isInSimpleQuery: true,
    },

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
