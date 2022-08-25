import { BaseModel, INeo4jModel } from "~models/base.model";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { OnEvent } from "@nestjs/event-emitter";

const modelName = "Cart";

@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class CartModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;


  async onModuleInit() {

  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

  }

  public static modelConfig: INeo4jModel = {
    select: "cart:Cart",
    as: "cart",
    relationships: {
      products: {
        model: "Product",
        modelAlias: "cartProduct",
        alias: "cartProductRelationship",
        type: "normal",
        isCollection: true,
        rel: "HAS_PRODUCTS"
      }
    }
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'price',
      label: 'Price',
      placeholder: 'Price',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'quantity',
      label: 'Quantity',
      placeholder: 'Quantity',
      type: 'number',
      isSortable: true,
      group: 'main',
    },
  ];
}
