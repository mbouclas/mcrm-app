import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~root/shared/models/queryBuilder';

const modelName = 'CartCondition';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class CartConditionModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public name: string;

  async onModuleInit() {}

  public static displayedColumns = ['title', 'category'];

  public static modelConfig: INeo4jModel = {
    select: 'cartCondition:CartCondition',
    as: 'cartCondition',
    relationships: {},
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
    },
    {
      varName: 'type',
      label: 'Type',
      placeholder: 'Type',
      type: 'text',
      isSortable: true,
      group: 'main',
      ui: {
        component: 'DropDown',
        defaultValues: ['tax', 'shipping', 'coupon'],
      },
    },
    {
      varName: 'target',
      label: 'Target',
      placeholder: 'Target',
      type: 'text',
      isSortable: true,
      group: 'main',
      ui: {
        component: 'DropDown',
        defaultValues: ['subtotal', 'price', 'total', 'quantity', 'numberOfItems', 'item'],
      },
    },
    {
      varName: 'value',
      label: 'Value',
      placeholder: 'Value',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'order',
      label: 'Order',
      placeholder: 'Order',
      type: 'number',
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'rules',
      label: 'Rules',
      placeholder: 'Rules',
      type: 'json',
      isSortable: false,
      group: 'main',
    },

    {
      varName: 'attributes',
      label: 'Attributes',
      placeholder: 'Attributs',
      type: 'json',
      isSortable: false,
      group: 'main',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'CartCondition',
      filterType: 'partial',
      isInSimpleQuery: false,
    },

    {
      varName: 'type',
      label: 'Type',
      type: 'text',
      model: 'CartCondition',
      filterType: 'exact',
      isInSimpleQuery: false,
    },

    {
      varName: 'target',
      label: 'Target',
      type: 'text',
      model: 'CartCondition',
      filterType: 'exact',
      isInSimpleQuery: false,
    },

    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'CartCondition',
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
