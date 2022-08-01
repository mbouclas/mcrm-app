import {merge} from 'lodash';
import {IGenericObject} from "../models/general";
import {NextFunction, Request, Response} from "express";
// import {getMetadataArgsStorage} from "routing-controllers";
import {createFilterUrl} from "./serializers";
import { METHOD_METADATA, PATH_METADATA, PROPERTY_DEPS_METADATA } from "@nestjs/common/constants";
import { app } from "../main";

export class NamedRoutes {
    public static absolute = true;
    public static names: IGenericObject = {};


    static get(name: string) {
        return this.names[name] || '';
    }

    static setOne(name: string, path: string | RegExp) {
        if (typeof path === 'string' && path.indexOf('/') === 0) {
            path = path.substring(1).replace(/\/$/, "");
        }

        this.names[name] = path;

        return this;
    }

    static set(names: IGenericObject, base: string) {
        if (base){
            for (var a in names){
                names[a] = base + names[a];
            }
        }

        this.names = merge(names, this.names);
        return this;
    }

    static url(name: string, params: IGenericObject = {}, queryParams: IGenericObject = {}) {
        if (typeof this.names[name] == 'undefined'){
            return '';
        }

        let optionalParams = this.names[name].match(/:.*\?/g);
        if (optionalParams && optionalParams.length > 0) {
            optionalParams.forEach(param => {
                const paramName = param.replace('?', '');
                const cleanParamName = paramName.replace(':', '');
                // If this optional parameter is missing, remove it from the url
                if (!params[cleanParamName]) {
                    this.names[name] = this.names[name].replace(param, '');
                }

                this.names[name] = this.names[name].replace(param, paramName);
            });
        }

        const prefix = (this.absolute) ? '/' : '';
        if (Object.keys(params).length > 0){
            let temp = this.names[name];
            for (let a in params){
                temp = temp.replace(':'+ a,params[a]);
            }

            return createFilterUrl((prefix + temp).replace(`//`, '/'), queryParams);
        }


        return createFilterUrl((prefix + this.names[name]).replace(`//`, '/'), queryParams);
    }

    static use(res: any, req: any, next: any) {
        res.locals.Route = NamedRoutes;
        next();
    }
}

export const NamedRoute = (name: string, parent?: string) => (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => {
    const originalMethod = descriptor.value;
// @ts-ignore

    setTimeout(() => {
        NamedRoutes.setOne(name, `${parent}${Reflect.getMetadata(PATH_METADATA, descriptor.value)}`);
        // console.log(Reflect.getMetadata(PATH_METADATA, descriptor.value.constructor))
        // console.log(Reflect.getMetadata(PATH_METADATA, descriptor.value))
/*        const routes = getMetadataArgsStorage().actions
            .filter(item => {
                return item.method === propertyKey && target.constructor === item.target
            });

        const controller = getMetadataArgsStorage().controllers.filter(item => target.constructor === item.target)[0];

        NamedRoutes.setOne(name, `${controller.route}${routes[0].route}`);*/
    }, 50);

}

