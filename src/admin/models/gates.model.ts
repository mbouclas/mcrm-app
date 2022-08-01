import { BaseModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "./dynamicFields";

const modelName = 'Gate';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class GatesModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'gate',
      label: 'Gate',
      placeholder: 'Gate',
      type: 'input',
      group: 'main',
    },
    {
      varName: 'provider',
      label: 'Provider',
      placeholder: 'Provider',
      type: 'input',
      group: 'main',
    },
    {
      varName: 'level',
      label: 'Level',
      placeholder: 'Level',
      type: 'number',
      group: 'main',
    },
  ];
}
