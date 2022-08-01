import { Injectable } from '@nestjs/common';
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel } from "~models/base.model";

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
}
