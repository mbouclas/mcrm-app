import { Injectable } from '@nestjs/common';
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel } from "~models/base.model";

const modelName = 'Review';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class ReviewModel extends BaseModel
{
  public modelName = modelName;
  public static modelName = modelName;
}
