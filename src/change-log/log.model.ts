import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

const modelName = "LogEntry";

@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class LogModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'logEntry:LogEntry',
    as: 'logEntry',
    relationships: {
      user: {
        rel: 'HAS_LOGS',
        alias: 'userRelationship',
        model: 'User',
        modelAlias: 'user',
        type: 'inverse',
        isCollection: false,
      },
    },
  }

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'object',
      label: 'Object',
      type: 'text',
      group: 'main',
      exported: true,
      required: true,
    },
  ];
}
