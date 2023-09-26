import { filter, findIndex } from "lodash";
import {Container} from "typedi";
import { IGenericObject } from "~models/general";
import { BaseModel } from "~models/base.model";


export interface IMcmsDiRegistryItem<T = any> {
    id: string;
    type: 'component'|'service'|'class'|'middleware'|'helper'|'controller'|'model'|'shippingMethodProvider'|'paymentMethodProvider'|'hook'|'patch'|'upgrade'|'driver';
    title?: string;
    description?: string;
    reference?: any;
    usedFor?: string;
    model?: string;
    category?: string; // used for hooks and other types that you need to differentiate. for example: orders, products, etc. Best practice is to use the model name
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
}


export const McmsDi = (obj: IMcmsDiRegistryItem): any => {
    return (cls: any) => {
        obj.reference = cls;
        McmsDiContainer.add(obj);
    };
};
