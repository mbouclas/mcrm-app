import { IQueryBuilderFieldBlueprint } from "../shared/models/queryBuilder";
import { BaseModel, IBaseModelFilterConfig } from "./base.model";
import { IPagination } from "./general";

export interface IItemSelector {

}

export interface IItemSelectorFilterField {
  varName: string;
  label: string;
  placeholder: string;
  type: string;
}

export interface IItemSelectorTab {
  varName: string;
  label: string;
  provider: string;
  url: string;
  filterFields: () => IQueryBuilderFieldBlueprint[];
  config: IBaseModelFilterConfig;
}

export interface IItemSelectorConfig {
  module: string;
  varName: string;
  slice: string;
  label: string;
  priority?: number;
  gates?: string[];
  tabs: IItemSelectorTab[];
}

export interface IITemSelectorRequestResponse extends IPagination<any> {
  data: IITemSelectorResultData[];
}

export interface IITemSelectorResultData {
  uuid: string;
  name: string;
  originalObject: BaseModel;
}
