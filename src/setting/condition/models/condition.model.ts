import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

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

  async onModuleInit() { }

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

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
