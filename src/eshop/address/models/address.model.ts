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
    relationships: {
      user: {
        model: 'User',
        modelAlias: 'user',
        alias: 'userRelationship',
        type: 'inverse',
        isCollection: false,
        rel: 'HAS_ADDRESS',
      }
    },
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
      varName: 'region',
      label: 'Region',
      placeholder: 'Region',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'postCode',
      label: 'Postal Code',
      placeholder: 'Postal Code',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'phone',
      label: 'Phone',
      placeholder: 'Phone',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'firstName',
      label: 'First Name',
      placeholder: 'First Name',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'lastName',
      label: 'Last Name',
      placeholder: 'Last Name',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'notes',
      label: 'Notes',
      placeholder: 'Notes',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'default',
      label: 'Default',
      placeholder: 'Default',
      type: 'boolean',
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
