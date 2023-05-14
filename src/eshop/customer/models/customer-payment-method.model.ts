import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'CustomerPaymentMethod';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class CustomerPaymentMethodModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public uuid: string;
  public providerPaymentMethodId: string;
  async onModuleInit() {}

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'customerPaymentMethod:CustomerPaymentMethod',
    as: 'customerPaymentMethod',
    relationships: {},
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'userId',
      label: 'UserId',
      placeholder: 'UserId',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'paymentMethodId',
      label: 'PaymentMethodId',
      placeholder: 'PaymentMethodId',
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
      varName: 'providerPaymentMethodId',
      label: 'ProviderPaymentMethodId',
      placeholder: 'ProviderPaymentMethodId',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'providerCustomerId',
      label: 'ProviderCustomerId',
      placeholder: 'ProviderCustomerId',
      type: 'text',
      group: 'main',
    },

    {
      varName: 'cardBrand',
      label: 'CardBrand',
      placeholder: 'CardBrand',
      type: 'text',
      group: 'main',
    },

    {
      varName: 'cardLast4',
      label: 'Last4',
      placeholder: 'Last4',
      type: 'number',
      group: 'main',
    },

    {
      varName: 'cardExpiryMonth',
      label: 'CardExpiryMonth',
      placeholder: 'CardExpiryMonth',
      type: 'number',
      group: 'main',
    },

    {
      varName: 'cardExpiryYear',
      label: 'CardExpiryYear',
      placeholder: 'CardExpiryYear',
      type: 'number',
      group: 'main',
    },

    {
      varName: 'confirmed',
      label: 'Confirmed',
      placeholder: 'Confirmed',
      type: 'text',
      group: 'main',
    },

    {
      varName: 'default',
      label: 'Default',
      placeholder: 'Default',
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
