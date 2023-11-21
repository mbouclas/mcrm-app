import { filter, findIndex, find } from "lodash";
import {Container} from "typedi";
import { IGenericObject } from "~models/general";
import { BaseModel } from "~models/base.model";


export interface IMcmsDiRegistryItem<T = any> {
    id: string;
    type: 'component'|'service'|'class'|'middleware'|'helper'|'controller'|'model'|'shippingMethodProvider'|'paymentMethodProvider'|'provider'|'hook'|'patch'|'upgrade'|'driver'|'executor' | 'worker';
    title?: string;
    description?: string;
    reference?: any;
    usedFor?: string;
    model?: string;
    category?: string; // used for hooks and other types that you need to differentiate. for example: orders, products, etc. Best practice is to use the model name
    metaData?: IGenericObject;
}

export class McmsDiContainer {
    static registry: IMcmsDiRegistryItem[] = [];

    static get<T = any>(filter: IGenericObject): null|IMcmsDiRegistryItem<T> {
        const idx = findIndex(this.registry, filter);
        if (idx === -1) {
            return null;
        }

        return this.registry[idx];
    }

    static getAndInstantiate<T = any>(filter: IGenericObject): null|T {
        const container = this.get(filter);
        if (!container) {return null;}

        // try to get the item from the DI registry. Need to have the same id as in the DI
        return container.reference;
    }

    static add(obj: IMcmsDiRegistryItem) {
        if (this.registry.includes(obj)) {return;}
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

    static filter(filters: IGenericObject) {
        return filter(McmsDiContainer.all(), filters) as IMcmsDiRegistryItem[];
    }

    static findOne(filters: IGenericObject) {
        return find(McmsDiContainer.all(), filters) as IMcmsDiRegistryItem;
    }
}


export const McmsDi = (obj: IMcmsDiRegistryItem): any => {
    return (cls: any) => {
        obj.reference = cls;
        if (['shippingMethodProvider','paymentMethodProvider','provider','hook','patch','upgrade','driver','middleware','helper'].indexOf(obj.type) !== -1) {
            if (typeof obj.reference.metaData !== 'object') {
                obj.reference.metaData = {};
            }

            obj.reference.metaData = {
                ...{
                    description: obj.description || undefined,
                    title: obj.title || undefined,
                    usedFor: obj.usedFor || undefined,
                    category: obj.category || undefined,
                    id: obj.id || undefined,
                    type: obj.type || undefined,
                    metaData: obj.metaData || undefined,
                }
            };
        }

        McmsDiContainer.add(obj);
    };
};
