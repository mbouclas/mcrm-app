import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel } from "~models/base.model";

const modelName = 'PageCategory';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class PageCategoryModel extends BaseModel implements OnModuleInit
{
  public modelName = modelName;
  public static modelName = modelName;

  async onModuleInit() {

  }
}
