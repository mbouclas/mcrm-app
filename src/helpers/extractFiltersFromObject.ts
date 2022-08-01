import { IGenericObject } from "~models/general";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";


export function extractSingleFilterFromObject(filter: IGenericObject) {
    const key = Object.keys(filter)[0];
    const value = filter[key];

    return {key, value};
}

export function extractFiltersFromObject(filters: IGenericObject, key: string, paramMap?: IDynamicFieldConfigBlueprint[]) {
    return Object.keys(filters).map(k => {
        const field = paramMap.find(f => f.varName === k);
        // Check the type of the fields if there's a paramMap
        if (!paramMap || !field) {
            return `${key}.${k} =~ '(?i).*${filters[k]}.*'`;
        }

        // there is a field type
        let qs;
        switch (field.type) {
            case 'boolean': qs = `${key}.${k} = ${filters[k]}`;
            break;
            default: qs = `${key}.${k} =~ '(?i).*${filters[k]}.*'`;
        }

        return qs;
    }).join(' AND ')
}
