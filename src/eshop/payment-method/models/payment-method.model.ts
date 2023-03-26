import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'PaymentMethod';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PaymentMethodModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public uuid: string;
  public title: string;
  public providerSettings: Record<string, any>;
  async onModuleInit() {}

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'paymentMethod:PaymentMethod',
    as: 'paymentMethod',
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
      varName: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'boolean',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'logo',
      label: 'Logo',
      placeholder: 'Logo',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'surcharge',
      label: 'Supercharge',
      placeholder: 'Supercharge',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'supercharge_type',
      label: 'SuperchargeType',
      placeholder: 'SuperchargeType',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'settings',
      label: 'Settings',
      placeholder: 'Settings',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'providerSettings',
      label: 'ProviderSettings',
      placeholder: 'ProviderSettings',
      type: 'json',
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
