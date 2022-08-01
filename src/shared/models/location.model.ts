import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
export interface ILocationFieldType {
  varName: string;
  type: string;
}

const modelName = 'Location';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class LocationModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  static locationFields: ILocationFieldType[] = [
    {
      varName: 'latitude',
      type: 'number'
    },
    {
      varName: 'longitude',
      type: 'number'
    },
    {
      varName: 'zoomLevel',
      type: 'number'
    },
    {
      varName: 'formattedAddress',
      type: 'string'
    }
  ];
  public longitude: number;
  public latitude: number;
  public zoomLevel: number;
  public formattedAddress: string;
  public static modelConfig: INeo4jModel = {
    select: 'location:Location',
    as: 'location',
    relationships: {}
  };
  public static fields: IDynamicFieldConfigBlueprint[] = [];
  public static filterFields: IQueryBuilderFieldBlueprint[] = [];
  //public static itemSelector: IItemSelectorConfig = {};

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };
}
