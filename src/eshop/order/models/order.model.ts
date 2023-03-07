import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';

const modelName = 'Order';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class OrderModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public orderId: string;
  public userId: string;
  public uuid: string;
  public paymentInfo: string;
  public shippingInfo: string;

  async onModuleInit() { }

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'order:Order',
    as: 'order',
    relationships: {
      product: {
        model: 'Product',
        modelAlias: 'product',
        alias: 'productRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_PRODUCT',
      },
      user: {
        model: 'User',
        modelAlias: 'user',
        alias: 'userRelationship',
        type: 'inverse',
        isCollection: true,
        rel: 'HAS_USER',
      },

      paymentMethod: {
        model: 'PaymentMethod',
        modelAlias: 'paymentMethod',
        alias: 'paymentMethodRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_PAYMENT_METHOD',
        tabs: ['General'],
        group: 'right',
      },

      shippingMethod: {
        model: 'ShippingMethod',
        modelAlias: 'shippingMethod',
        alias: 'shippingMethodRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_SHIPPING_METHOD',
        tabs: ['General'],
        group: 'right',
      },
      address: {
        model: 'Address',
        modelAlias: 'address',
        alias: 'addressRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ADDRESS',
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'orderId',
      label: 'OrderId',
      placeholder: 'OrderId',
      type: 'text',
      isSortable: true,
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'userId',
      label: 'UserId',
      placeholder: 'UserId',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'total',
      label: 'Total',
      placeholder: 'Total',
      type: 'number',
      isSortable: true,
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'number',
      isSortable: true,
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
        ],
      },
    },
    {
      varName: 'paymentStatus',
      label: 'PaymentStatus',
      placeholder: 'PaymentStatus',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingStatus',
      label: 'ShippingStatus',
      placeholder: 'ShippingStatus',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'VAT',
      label: 'VAT',
      placeholder: 'VAT',
      type: 'number',
      isSortable: true,
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingMethod',
      label: 'ShippingMethod',
      placeholder: 'ShippingMethod',
      type: 'text',
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'paymentMethod',
      label: 'PaymentMethod',
      placeholder: 'PaymentMethod',
      type: 'text',
      group: 'hidden',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'notes',
      label: 'Notes',
      placeholder: 'Notes',
      type: 'text',
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'salesChannel',
      label: 'SalesChannel',
      placeholder: 'SalesChannel',
      type: 'text',
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'billingAddressId',
      label: 'BillingAddressId',
      placeholder: 'BillingAddressId',
      type: 'text',
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingAddressId',
      label: 'ShippingAddressId',
      placeholder: 'ShippingAddressId',
      type: 'text',
      group: 'main',
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'paymentInfo',
      label: 'PaymentInfo',
      placeholder: 'PaymentInfo',
      type: 'json',
      group: 'main',
      fields: [
        {
          varName: 'provider',
          label: 'Provider',
          placeholder: 'Provider',
          type: 'text',
          group: 'main',
          default: false,
        },
        {
          varName: 'price',
          label: 'Price',
          placeholder: 'Price',
          type: 'number',
          group: 'main',
          default: false,
        },
      ],
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingInfo',
      label: 'ShippingInfo',
      placeholder: 'ShippingInfo',
      type: 'json',
      group: 'main',
      fields: [
        {
          varName: 'status',
          label: 'Status',
          placeholder: 'Status',
          type: 'text',
          group: 'main',
          default: false,
        },
      ],
      editableRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'userId',
      label: 'UserId',
      type: 'text',
      model: 'Order',
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
