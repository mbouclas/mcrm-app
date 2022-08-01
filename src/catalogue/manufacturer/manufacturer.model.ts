import { Injectable } from '@nestjs/common';
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel } from "~models/base.model";

const modelName = 'Manufacturer';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class ManufacturerModel extends BaseModel
{
  public modelName = modelName;
  public static modelName = modelName;
}
