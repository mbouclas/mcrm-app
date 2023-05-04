import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'Customer';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class CustomerModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public uuid: string;
  public customerId: string;
  async onModuleInit() {}

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'customer:Customer',
    as: 'customer',
    relationships: {},
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'customerId',
      label: 'CustomerId',
      placeholder: 'CustomerId',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'provider',
      label: 'Provider',
      placeholder: 'Provider',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'userId',
      label: 'UserId',
      placeholder: 'UserId',
      type: 'text',
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
