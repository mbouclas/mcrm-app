import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'ShippingMethod';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ShippingMethodModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;

  async onModuleInit() {}

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'shippingMethod:ShippingMethod',
    as: 'shippingMethod',
    relationships: {
      shippingMethod: {
        model: 'ShippingMethod',
        modelAlias: 'shippingMethod',
        alias: 'shippingMethodRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_SHIPPING_METHOD',
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
      varName: 'shippingTime',
      label: 'ShippingTime',
      placeholder: 'ShippingTime',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'destination',
      label: 'Destination',
      placeholder: 'Destination',
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
      varName: 'parentId',
      label: 'ParentId',
      placeholder: 'parentId',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'boolean',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'weight_min',
      label: 'WeightMin',
      placeholder: 'WeightMin',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'weight_limit',
      label: 'WeightLimit',
      placeholder: 'WeightLimit',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'base_cost',
      label: 'BaseCost',
      placeholder: 'BaseCost',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'settings',
      label: 'Settings',
      placeholder: 'Settings',
      type: 'string',
      isSortable: true,
      group: 'main',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
