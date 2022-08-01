import {IGenericObject} from "./general";

export class BaseModel {
    public uuid?: string;
    public slug?: string;
    public createdAt: Date = new Date();
    public updatedAt: Date = new Date();
    [key: string]: any;

    public set(obj: IGenericObject) {
        for (let key in obj) {
            this[key] = obj[key];
        }

        return this;
    }
}

export class BaseTreeModel extends BaseModel {
    children?: BaseTreeModel[];
}
