import { Injectable } from '@nestjs/common';
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel, INeo4jModel } from "~models/base.model";

const modelName = 'Property';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class PropertyModel extends BaseModel
{
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'property:Property',
    as: 'property',
    relationships: {},
  }
}
