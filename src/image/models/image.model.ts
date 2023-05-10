import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

const modelName = "Image";

@McmsDi({
  id: modelName,
  type: "model"
})
@Injectable()
export class ImageModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;

  async onModuleInit() {

  }

  public static modelConfig: INeo4jModel = {
    select: "image:Image",
    as: "image",
    relationships: {}
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: "active",
      label: "Active",
      placeholder: "Active",
      type: "boolean",
      isSortable: true,
      group: "main"
    },
    {
      varName: "url",
      label: "URL",
      placeholder: "URL",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "originalLocation",
      label: "Original Location",
      placeholder: "Original Location",
      type: "text",
      isSortable: false,
      group: "hidden"
    },
    {
      varName: "path",
      label: "Path",
      placeholder: "Path",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "type",
      label: "Type",
      placeholder: "Type",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "alt",
      label: "Alt",
      placeholder: "Alt",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "title",
      label: "Title",
      placeholder: "Title",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "caption",
      label: "Caption",
      placeholder: "Caption",
      type: "text",
      isSortable: true,
      group: "main"
    },
    {
      varName: "description",
      label: "Description",
      placeholder: "Description",
      type: "textarea",
      isSortable: true,
      group: "main"
    },
  ];
}
