import { findIndex } from "lodash";
import {Container} from "typedi";
import { IGenericObject } from "../models/general";
import { BaseModel } from "../models/base.model";


export interface IMcmsDiRegistryItem {
    id: string;
    type: 'component'|'service'|'class'|'middleware'|'helper'|'controller'|'model';
    reference?: any;
    usedFor?: string;
    model?: string;
}

export class McmsDiContainer {
    static registry: IMcmsDiRegistryItem[] = [];

    static get(filter: IGenericObject) {

        const idx = findIndex(this.registry, filter);
        if (idx === -1) {
            return null;
        }

        return this.registry[idx];
    }

    static add(obj: IMcmsDiRegistryItem) {
        this.registry.push(obj);
    }

    static model(id: string): BaseModel {
        return this.get({id, type: 'model'})?.reference;
    }

    /**
     * Only works with classes injected at the DI using @Service()
     * @param filter
     */
    static freshInstance(filter: IGenericObject) {
        const item = this.get(filter);
        if (!item) {return null;}

        // try to get the item from the DI registry. Need to have the same id as in the DI
        return Container.get(item.id);

    }

    static all() {
        return this.registry;
    }
}


export const McmsDi = (obj: IMcmsDiRegistryItem): any => {
    return (cls: any) => {
        obj.reference = cls;
        McmsDiContainer.add(obj);
    };
};
