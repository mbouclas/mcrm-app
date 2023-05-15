import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'Address';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class AddressModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public orderId: string;
  public userId: string;
  public uuid: string;

  async onModuleInit() {}

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'address:Address',
    as: 'address',
    relationships: {},
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'userId',
      label: 'UserId',
      placeholder: 'UserId',
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
      varName: 'city',
      label: 'City',
      placeholder: 'City',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'county',
      label: 'Country',
      placeholder: 'Country',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'street',
      label: 'Street',
      placeholder: 'Street',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'zipcode',
      label: 'Zipcode',
      placeholder: 'Zipcode',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'userId',
      label: 'UserId',
      type: 'text',
      model: 'Address',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
