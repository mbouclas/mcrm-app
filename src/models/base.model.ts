import { IDynamicFieldConfigBlueprint } from "../admin/models/dynamicFields";
import { IGenericObject, IPagination } from "./general";
import { IQueryBuilderFieldBlueprint } from "../shared/models/queryBuilder";
import { IRelationshipToInject } from "../admin/services/model-generator.service";
import { findIndex } from "lodash";
import { IItemSelectorConfig } from "~models/item-selector";
import { Logger } from "@nestjs/common";
export interface IBaseModelFilterConfig {
  results_per_page?: number;
  allowMultiple?: boolean;
  maxSelectedItems?: number;
  minSelectedItems?: number;
  useSelectorComponent?: boolean;
  useQueryBuilderComponent?: boolean;
  executeOnLoad?: boolean;
  filterParamName?: string;
  minNumberOfCharacterForSearch?: number;
  maxNumberOfCharacterForSearch?: number;
  defaultOrderBy?: string;
  defaultWay?: string;
}

export interface INeo4jModel {
  select: string;
  as: string;
  relationships: IGenericObject<INeo4jModelRelationshipConfig>;
}

export interface INeo4jModelRelationshipConfig {
  alias: string;
  rel: string;
  model: string;
  modelAlias: string;
  exactAliasQuery?: boolean;
  type: 'inverse'|'normal',
  isCount?: boolean;
  isCollection: boolean,
  isSortable?: boolean,
  isSortableCount?: boolean;
  sortableCountDefaultAlias?: string;
  orderByKey?: string;
  defaultProperty?: string;
  relKey?: string;
  isTree?: boolean;
  isMultilingual?: boolean;
  addRelationshipData?: boolean;
}

export class BaseModel {
  protected readonly logger = new Logger(BaseModel.name);
  public static modelName: string;
  public modelName: string;
  public name: string;
  public test = 1;
  public static modelConfig: INeo4jModel;
  public static fields: IDynamicFieldConfigBlueprint[] = [];
  public static itemSelector?: IItemSelectorConfig;
  public static filterFields: IQueryBuilderFieldBlueprint[] = [];
  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
  };
  public static injectRelationships: IGenericObject<IRelationshipToInject>|string;

  getFields() {
    return (this.constructor as typeof BaseModel).fields;
  }

  hasField(field: string) {
    return this.hasOwnProperty(field);
  }

  public static isFieldSortable(field: string, fields: IDynamicFieldConfigBlueprint[]) {
    return findIndex(fields, {varName: field, isSortable: true}) !== -1;
  }

  public static isFieldSortableCount(field: string, relationships: INeo4jModelRelationshipConfig) {
    // @ts-ignore
    const found = Object.keys(relationships).filter(key => key === field && relationships[key].isSortableCount).length > 0;
    if (found) {return true;}
    // Try out for aliases
    return BaseModel.getSortableCountField(field, relationships);
  }

  public static getSortableCountField(field: string, relationships: INeo4jModelRelationshipConfig) {
    // @ts-ignore
    const fields = Object.keys(relationships).filter(key => field && relationships[key].isSortableCount && field === relationships[key].sortableCountDefaultAlias);
    if (fields.length === 0) {return false;}

    return fields[0];
  }


}
