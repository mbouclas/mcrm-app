import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';

const modelName = 'PropertyValue';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class PropertyValueModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'product:Product',
    as: 'product',
    relationships: {
      property: {
        model: 'Property',
        modelAlias: 'property',
        alias: 'propertyRelationship',
        type: 'inverse',
        isCollection: false,
        rel: 'HAS_VALUE',
      },
    },
  };
}
