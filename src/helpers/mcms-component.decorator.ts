import { findIndex } from "lodash";
import {Container} from "typedi";
import { IGenericObject } from "../models/general";
import { BaseModel } from "../models/base.model";
import { BasePaymentMethodProvider } from "~eshop/payment-method/providers/base-payment-method.provider";

export interface IMcmsDiRegistryItem<T = any> {
    id: string;
    type: 'component'|'service'|'class'|'middleware'|'helper'|'controller'|'model';
    reference?: any;
    usedFor?: string;
    model?: string;
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
}


export const McmsDi = (obj: IMcmsDiRegistryItem): any => {
    return (cls: any) => {
        obj.reference = cls;
        McmsDiContainer.add(obj);
    };
};
