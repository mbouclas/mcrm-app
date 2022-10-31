import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";

const modelName = 'Order';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class OrderModel extends BaseModel implements OnModuleInit
{
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public orderId: string;

  async onModuleInit() {

  }

  public static displayedColumns =  [];

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
        rel: 'HAS_PRODUCT'
      },
      user: {
        model: 'User',
        modelAlias: 'user',
        alias: 'userRelationship',
        type: 'inverse',
        isCollection: true,
        rel: 'HAS_USER'
      },
    }
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'orderId',
      label: 'OrderId',
      placeholder: 'OrderId',
      type: 'text',
      isSortable: true,
      group: 'main'
    },
    {
      varName: 'total',
      label: 'Total',
      placeholder: 'Total',
      type: 'number',
      isSortable: true,
      group: 'main'
    },
    {
      varName: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'number',
      isSortable: true,
      group: 'main'
    },
    {
      varName: 'shippingMethod',
      label: 'ShippingMethod',
      placeholder: 'ShippingMethod',
      type: 'text',
      group: 'main'
    },
    {
      varName: 'paymentMethod',
      label: 'PaymentMethod',
      placeholder: 'PaymentNethod',
      type: 'text',
      group: 'main'
    },
    {
      varName: 'notes',
      label: 'Notes',
      placeholder: 'Notes',
      type: 'text',
      group: 'main'
    }
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };
}
