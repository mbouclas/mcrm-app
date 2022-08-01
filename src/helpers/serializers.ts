import {IGenericObject} from "../models/general";
const querystring = require('querystring');

export function serializeQuery(obj: any): string {
    const params = [];
    for (let key in obj) {
        params.push(`${key}:${obj[key]}`);
    }

    return params.join(',');
}

export function unserializeQuery(str: string): object {
    const arr = str.split(',');
    const obj: any = {};
    arr.forEach(item => {
        const parts = item.split(':');
        obj[parts[0]] = parts[1];
    });

    return obj;
}

export function createFilterUrl(url: string, filters: IGenericObject = {}) {
    if (Object.keys(filters).length > 0) {
        url = `${url}?${querystring.stringify(filters)}`;
    }

    return  url;
}
