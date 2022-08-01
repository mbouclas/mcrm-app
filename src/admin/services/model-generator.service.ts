import { IGenericObject } from "../../models/general";
import { BaseModel, IBaseModelFilterConfig, INeo4jModel, INeo4jModelRelationshipConfig } from "../../models/base.model";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "../models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "../../shared/models/queryBuilder";

export interface IRelationshipToInject {
  [key: string]: INeo4jModelRelationshipConfig;
}

interface ModelInstance {
  name: string;
  modelConfig: INeo4jModel;
  filterConfig: IBaseModelFilterConfig;
  injectRelationships: IGenericObject<IRelationshipToInject>|string;
  fields?: IDynamicFieldConfigBlueprint[];
  filterFields?: IQueryBuilderFieldBlueprint[]
}

@Injectable()
export class ModelGeneratorService {
  instance: BaseModel;
  staticClass: typeof BaseModel;

  constructor(model: ModelInstance) {
    const dynamicClass = this.newClass(model.name, BaseModel);

    this.instance = new BaseModel();
    dynamicClass.modelName = model.name;
    dynamicClass.modelConfig = model.modelConfig;
    dynamicClass.filterConfig = model.filterConfig;
    dynamicClass.fields = model.fields || [];
    dynamicClass.filterFields = model.filterFields || [];
    if (model.injectRelationships) {
      dynamicClass.injectRelationships = model.injectRelationships
    }

    dynamicClass.modelName = model.name;

    this.staticClass = dynamicClass as typeof BaseModel;
  }

  newClass (name, cls)  {
    return ({[name] : class extends cls {}})[name];
  }
}
