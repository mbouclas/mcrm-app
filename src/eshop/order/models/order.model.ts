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
  public total: number;
  public status: number;
  public shippingMethod: string;
  public paymentMethod: string;

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

  public static fields: IDynamicFieldConfigBlueprint[] = [];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };
}
