import { BaseModel, INeo4jModel } from "~models/base.model";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

const modelName = 'File';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class FileModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  public static modelConfig: INeo4jModel = {
    select: 'file:File',
    as: 'file',
    relationships: {

    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'filename',
      label: 'Filename',
      placeholder: 'Filename',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'originalFilename',
      label: 'Original Filename',
      placeholder: 'Original Filename',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'bucket',
      label: 'Bucket',
      placeholder: 'Bucket',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'driver',
      label: 'Driver',
      placeholder: 'Driver',
      type: 'select',
      options: [
        { label: 'Local', value: 'local' },
        { label: 'Object Storage', value: 'oss' },
      ],
      isSortable: true,
      group: 'main',
    },
  ];
}
