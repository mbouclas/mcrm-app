import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

const modelName = 'ProductVariant';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class ProductVariantModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'productVariant:ProductVariant',
    as: 'productVariant',
    relationships: {
      product: {
        rel: 'HAS_VARIANTS',
        alias: 'productVariantRelationship',
        model: 'Product',
        modelAlias: 'product',
        type: 'inverse',
        isCollection: true,
      },
    }
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      type: 'boolean',
      translatable: true,
      group: 'main'
    },
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'text',
      translatable: true,
      required: true,
      setDefaultTranslationInModel: true,
      group: 'main'
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      translatable: true,
      group: 'main'
    },
    {
      varName: 'price',
      label: 'Price',
      placeholder: 'Price',
      type: 'number',
      translatable: true,
      group: 'main'
    },


  ];
}
