import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'Gate';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class GateModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public uuid?: string;
  public static modelConfig: INeo4jModel = {
    select: 'role:Gate',
    as: 'role',
    relationships: {},
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'string',
      group: 'main',
    },

    {
      varName: 'provider',
      label: 'Provider',
      placeholder: 'Provider',
      type: 'string',
      group: 'main',
    },
    {
      varName: 'gate',
      label: 'Gate',
      placeholder: 'Gate',
      type: 'string',
      group: 'main',
    },
    {
      varName: 'level',
      label: 'Level',
      placeholder: 'Level',
      type: 'string',
      group: 'main',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'name',
      placeholder: 'Name',
      label: 'Name',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      filterType: 'partial',
      model: 'Gate',
      filterField: '',
      order: 0,
    },

    {
      varName: 'provider',
      placeholder: 'Provider',
      label: 'Provider',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      filterType: 'partial',
      model: 'Gate',
      filterField: '',
      order: 0,
    },

    {
      varName: 'gate',
      placeholder: 'Gate',
      label: 'Gate',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      filterType: 'partial',
      model: 'Gate',
      filterField: '',
      order: 0,
    },

    {
      varName: 'level',
      label: 'Level',
      type: 'number',
      model: 'Gate',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'levelMin',
      rangeToFieldName: 'levelMax',
      isInSimpleQuery: false,
    },

    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Gate',
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
