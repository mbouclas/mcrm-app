import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IEditableRegionItem } from "~website/editable-regions/models.editable-regions.model";
import { IGenericObject } from "~models/general";

const modelName = 'EditableRegion';

@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class EditableRegionModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public layout: string;
  public region: string;
  public items: IEditableRegionItem[];
  public settings: IGenericObject;
  public executor: string;

  public static modelConfig: INeo4jModel = {
    select: 'editableRegion:EditableRegion',
    as: 'editableRegion',
    relationships: {

    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'layout',
      label: 'Layout',
      placeholder: 'Layout',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'region',
      label: 'Region',
      placeholder: 'Region',
      type: 'text',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'items',
      label: 'Items',
      placeholder: 'Items',
      type: 'json',
      isSortable: true,
      group: 'main',
    },
    {
      varName: 'settings',
      label: 'Settings',
      placeholder: 'Settings',
      type: 'json',
      isSortable: true,
      group: 'main',
    },
  ];
}
