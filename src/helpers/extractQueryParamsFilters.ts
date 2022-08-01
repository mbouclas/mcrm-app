import {findIndex, uniq} from 'lodash';
import { IItemSelectorConfig } from "~models/item-selector";
import { BaseModel } from "~models/base.model";
import { IGenericObject, IPaginatedQueryParams } from "~models/general";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { LocationModel } from "~shared/models/location.model";



export function extractQueryParamsFilters(params: IPaginatedQueryParams, model: string|typeof BaseModel, itemSelector?: IItemSelectorConfig) {
    const modelAlias = (typeof model === 'string') ? model: model.modelConfig.as;
    const toRemove = ['page', 'limit', 'skip', 'per_page', 'type', 'orderBy', 'way', 'with'];
    const page = (params.page) ? params.page : 1;
    const limit = (params.limit) ? params.limit : 10;
    const skip = limit * (page - 1);
    let orderBy = (params.orderBy) ? `${modelAlias}.${params.orderBy}` : `${modelAlias}.name`;
    let way = (params.way) ? params.way : 'ASC';
    let relationships = params.with || [];
    const searchFields: string[] = (params.searchIn) ? params.searchIn: [];
    const where = [];
    let filters: any = {};

    // Add all the relationships to the query
    if (relationships.indexOf('*') !== -1 && typeof model !== 'string') {
        const tempRelationships: string[] = [];
        for (let key in model.modelConfig.relationships) {
            tempRelationships.push(key);
        }
        relationships = tempRelationships;
    }

    if (params.withLocationOnly) {
        where.push(`EXISTS(${modelAlias}.latitude)`);
    }

    if (params.withoutLocationOnly) {
        where.push(`NOT EXISTS(${modelAlias}.latitude)`);
    }

    if (params.uuids) {
        const uuids: string[] = (Array.isArray(params.uuids)) ? params.uuids : JSON.parse(params.uuids);
        where.push(`${modelAlias}.uuid IN [${uuids.map(id => `'${id}'`).join(',')}]`);
    }


    if (params.clientId && params.showClientItemsOnly) {
        where.push(`EXISTS((${modelAlias})<-[:ITEM_BELONGS_TO_CLIENT]-(:Client {uuid: '${params.clientId}'}))`);
    }

    // coming from itemSelector
    if (params.tab) {
        const searchableFields: string[] = [];
        // Figure out the tab
        const tabIdx = findIndex(itemSelector?.tabs, {varName: params.tab});
        const tab = itemSelector?.tabs[tabIdx];

        tab?.filterFields().forEach(field => searchableFields.push(field.varName));
        if (tab && tab.config && tab.config.filterParamName) {
            toRemove.push(tab.config.filterParamName);
            const paramValue = params[tab.config.filterParamName];
            const tmpValues: string[] = [];
            searchableFields.forEach(field => tmpValues.push(`${modelAlias}.${field} =~ '(?i).*${paramValue}.*'`));
            where.push(tmpValues.join(` OR `));
        }
    }

    if ((typeof model !== 'string' && model.filterConfig) && !params.tab) {

        const searchableFields: string[] = [];
        model.filterFields
            .filter((field: IQueryBuilderFieldBlueprint) => !field.relName)// If it has a relName, it's a relationship filter
            .forEach((field: IQueryBuilderFieldBlueprint) => searchableFields.push(field.varName));

        // Look up for q
        if (model.filterConfig.filterParamName && typeof params[model.filterConfig.filterParamName] !== 'undefined' && params[model.filterConfig.filterParamName]) {
            toRemove.push(model.filterConfig.filterParamName);
            const paramValue = params[model.filterConfig.filterParamName];
            const tmpValues: string[] = [];
            model.filterFields
                .filter((field: IQueryBuilderFieldBlueprint) => field.isInSimpleQuery)
                .filter((field: IQueryBuilderFieldBlueprint) => {
                    return (!searchFields || searchFields.length === 0 || searchFields.indexOf(field.varName) !== -1);
                })
                .map((field: IQueryBuilderFieldBlueprint) => field.varName)
                .filter((field: string) => field && true && field.length > 0)
                .forEach((field: string) => tmpValues.push(`${modelAlias}.${field} =~ '(?i).*${paramValue}.*'`));

            if (tmpValues.length > 0) {
                where.push(tmpValues.join(` OR `));
            }
        }
        orderBy = (!params.orderBy) ? `${modelAlias}.${model.filterConfig.defaultOrderBy}` : orderBy;
        way = (!params.way) ? model.filterConfig.defaultWay : way;
    }



    for (let key in params) {
        if (toRemove.indexOf(key) === -1 && params[key] && params[key] !== '') {
            filters[key] = params[key];
        }
    }

    for (let key in filters) {
        if (typeof filters[key] === 'undefined' || !filters[key] || filters[key] === 'undefined') {
            continue;
        }

        if (typeof model === 'string') {
            where.push(`${modelAlias}.${key} = '${filters[key]}'`);
            continue;
        }
        // find the filter
        const idx = findIndex(model.filterFields, {varName: key});

        if (idx === -1 || (model.filterFields[idx].model !== model.modelName) || model.filterFields[idx].relName) {continue;}

        const filter = model.filterFields[idx];


// Need to check if the filter belongs to another model. In that case we need a secondary filter to be applied to the setupRelationShipsQuery function

        const whereQuery = (filter.filterType === 'partial') ? `${modelAlias}.${key} =~ '(?i).*${filters[key]}.*'` : `${modelAlias}.${key} = ${buildWhereValueString(filter.type, filters[key])}`;

        where.push(whereQuery);



    }




    return {filters, orderBy, way, skip, limit, page, relationships, where};
}


export function setupRelationShipsQuery(model: typeof BaseModel, params: IGenericObject = {}, relationships: any, filters: any = {}) {
    const modelConfig = model.modelConfig;
    const modelAlias = modelConfig.as;
    const matches: string[] = [];
    const searchFields: string[] = (params.searchIn) ? params.searchIn: [];
    let returnVars: string[] = [modelAlias];
    const returnAliases: string[] = [modelAlias];
    /**
     * params.swapFilterFields = {tag: {filterField: 'slug'}}
     * Swaps uuid with slug
     */
    if (params.swapFilterFields && typeof params.swapFilterFields === 'string') {
        params.swapFilterFields = JSON.parse(params.swapFilterFields);
    }

    let orderByFound = false;
    let orderByCount = false;
    let orderBy = `${modelConfig.as}.${model.filterConfig.defaultOrderBy}`;

    if (params.orderBy) {
        orderByFound = model.isFieldSortable(params.orderBy, model.fields);
        orderBy = (orderByFound) ? `${modelConfig.as}.${params.orderBy}` : orderBy;
    }

    // Try out a count orderBy
    if (!orderByFound && typeof model.isFieldSortableCount === 'function') {
        // @ts-ignore
        orderByCount = model.isFieldSortableCount(params.orderBy, model.modelConfig.relationships);
    }

    //todo: Need to take into account translatable fields
    // Check for the simplified version of the translations

    const modelRelationships = Object.keys(model.modelConfig.relationships);

    if (modelRelationships.length > 0) {
        modelRelationships.forEach((r: string) => {
            if (modelRelationships.indexOf(r) === -1) {return;}
            if (relationships.indexOf(r) === -1 && !params[r]) {return;} // In case we have a query for a relationship, but we don't need the data
            const relationshipModel = model.modelConfig.relationships[r];
            if (!relationshipModel || !modelConfig.relationships || !modelConfig.relationships[r]) {return;}
            if (!orderByFound && relationshipModel.isSortable && relationshipModel.modelAlias === params.orderBy) {
                orderBy = (relationshipModel.isCount) ? params.orderBy :
                    `${relationshipModel.modelAlias}.${relationshipModel.orderByKey || params.orderBy}`;
                // look into relationships
                orderByFound = true;
            }

            const fromRel = (relationshipModel.type === 'normal') ? '-' : '<-';
            const toRel = (relationshipModel.type === 'normal') ? '->' : '-';
            let whereQuery = '';
            let optionalQuery = 'OPTIONAL';
/*            if (typeof filters[r] === 'undefined' || !filters[r] || filters[r] === 'undefined') {
                return;;
            }*/
            if (filters[r]) {
                // get the filterField
                const idx = findIndex(model.filterFields, {varName: r});
                let filterField = model.filterFields[idx];

                if (!filterField) {
                    // Lets check if we can find it in the location model
                    const fallBackIdx = findIndex(LocationModel.filterFields, {varName: r});
                    if (fallBackIdx === -1) {return;}
                    filterField = LocationModel.filterFields[fallBackIdx];
                }

                whereQuery = ' WHERE ';
                let filterKey = (filterField && filterField.filterField) ? filterField.filterField : r;
                // As a secondary check, lets check if we have a request to swap filterField keys
                if (params.swapFilterFields && params.swapFilterFields[relationshipModel.modelAlias]) {
                    filterKey = params.swapFilterFields[relationshipModel.modelAlias].filterField;
                }

                // Only allow for fields that are requested by the searchIn param, if set. Otherwise everything is included
                if (!searchFields || searchFields.length === 0 || searchFields.indexOf(r) !== -1) {
                    // Need to add an IN in case the value is an array
                    whereQuery += (filterField.filterType === 'partial') ? `${relationshipModel.modelAlias}.${filterKey} =~ '(?i).*${filters[r]}.*'` : `${relationshipModel.modelAlias}.${filterKey} = '${filters[r]}'`;
                    optionalQuery = '';// We can't have a where and an optional together
                }

            }
            const modelAliasQuery = (relationshipModel.exactAliasQuery) ? `${relationshipModel.modelAlias}:${relationshipModel.model}` : `${relationshipModel.modelAlias}`;
            matches.push(`${optionalQuery} MATCH (${modelAlias})${fromRel}[${modelConfig.relationships[r].alias}:${modelConfig.relationships[r].rel}]${toRel}(${modelAliasQuery}) ${whereQuery}`);
            if (relationshipModel.isCount) {
                returnVars.push(`count(distinct ${relationshipModel.modelAlias}) as ${relationshipModel.modelAlias}`);
            }
            else if (relationshipModel.isCollection) {
                (relationshipModel.addRelationshipData)
                    ? returnVars.push(`collect(distinct {model: ${relationshipModel.modelAlias}, relationship: ${relationshipModel.alias}}) as ${relationshipModel.modelAlias}`)
                    : returnVars.push(`collect(distinct ${relationshipModel.modelAlias}) as ${relationshipModel.modelAlias}`);
            }
            else {
                returnVars.push(relationshipModel.modelAlias);
            }

            returnAliases.push(relationshipModel.modelAlias);

            if (orderByCount) {
                const countFieldName = `${params.orderBy}Count`;
                returnVars.push(`count (distinct ${params.orderBy}) as ${countFieldName}`);
                returnAliases.push(countFieldName);
                orderBy = countFieldName;
            }
        });
    }

    returnVars = uniq(returnVars)
    return {matches, returnVars, returnAliases, orderByFound, orderBy}
}


export function buildWhereQueryFromFilter(filterName: string, filterValue: any, filters: IQueryBuilderFieldBlueprint[]) {

}

export function buildWhereValueString(type: string, value: any) {
    let valueQuery = `'${value}'`;
    // Do not put this value in quotes if of the following type
    if (['boolean', 'number'].indexOf(type) !== -1) {
        valueQuery = value;
    }

    return valueQuery;
}
