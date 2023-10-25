import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { McrmModel, Property } from "~neo4j/neo4j.decorators";
import { IPaymentMethodProvider } from "~eshop/payment-method/models/providers.types";



@Injectable()
@McrmModel('PaymentMethod')
export class PaymentMethodModel extends BaseModel implements OnModuleInit {

  public static defaultAggregationSize = 30;
  public uuid: string;
  public title: string;
  public providerSettings: Record<string, any>;
  async onModuleInit() {}

  public static displayedColumns = [];

  @Property({type: 'text', label: 'Provider Name', placeholder: 'Provider Name', varName: 'providerName', required: true, group: 'main'})
  public providerName: string;

  @Property({type: 'text', label: 'Slug', varName: 'slug', required: true, isSlug: true, slugFrom: 'title', group: 'hidden'})
  public slug;

  public provider: IPaymentMethodProvider;


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
      type: 'json',
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

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'PaymentMethod',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'status',
      label: 'Status',
      type: 'boolean',
      model: 'PaymentMethod',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
