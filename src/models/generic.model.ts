import {IGenericObject} from "./general";
import { BaseModel, IBaseModelFilterConfig } from "~models/base.model";


export class BaseTreeModel extends BaseModel {
    children?: BaseTreeModel[];
}
