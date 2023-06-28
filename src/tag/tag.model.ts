import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";

const modelName = "Tag";

@McmsDi({
  id: modelName,
  type: "model"
})
@Injectable()
export class TagModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public name: string;
  public slug;
  public uuid: string;

  constructor() {
    super();

    this.loadModelSettingsFromConfig();

  }

  public static modelConfig: INeo4jModel = {
    select: "tag:Tag",
    as: "tag",
    relationships: {}
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: "name",
      label: "Name",
      placeholder: "Name",
      type: "text",
      isSortable: true,
      group: "main",
      searchIndexSettings: {
        isAutoCompleteField: true
      }
    },
    {
      varName: "slug",
      label: "Slug",
      placeholder: "Slug",
      type: "text",
      group: "hidden",
      isSlug: true,
      slugFrom: "name"
    }
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: "name",
      label: "Name",
      type: "text",
      model: "Tag",
      filterType: "partial",
      isInSimpleQuery: true
    }
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
