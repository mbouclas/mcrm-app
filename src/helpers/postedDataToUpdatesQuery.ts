import {findIndex} from "lodash";
import { IGenericObject } from "~models/general";
import { LocationModel } from "~shared/models/location.model";
import { IDynamicFieldConfigBlueprint } from "~models/dynamic-fields.model";
const moment = require('moment');

const slug = require('slug');

export function postedDataToUpdatesQuery(fields: IDynamicFieldConfigBlueprint[], postedFields: IGenericObject, modelAlias: string, defaultLang?: string) {
    let queryParts: string[] = [];
    // Check for location fields
    LocationModel.locationFields.forEach(f => {
        if (postedFields[f.varName]) {
            const val = (f.type === 'string') ? `'${postedFields[f.varName]}'` : postedFields[f.varName];
            queryParts.push(`${modelAlias}.${f.varName} = ${val}`)
        }
    });

    const targetFields = fields
        .filter(field => !field.translatable || (field.translatable && field.setDefaultTranslationInModel));

    queryParts = queryParts.concat(targetFields
        .filter(field => typeof postedFields[field.varName] !== 'undefined')
        .map(field => {
            if (field.isSlug && field.setDefaultTranslationInModel) {
                return `${modelAlias}.slug = '${slug(postedFields[field.varName][defaultLang as any], {lower: true})}', ${modelAlias}.${field.varName} = '${postedFields[field.varName][defaultLang as any]}'`;
            }

            if (field.type === 'date') {
                return `${modelAlias}.${field.varName} = datetime('${moment(postedFields[field.varName]).toISOString()}')`;
            }

            if (field.type === 'boolean') {
                return `${modelAlias}.${field.varName} = $${field.varName}`;
            }

            if (!field.isSlug && !field.setDefaultTranslationInModel) {
                return `${modelAlias}.${field.varName} = $${field.varName}`;
            }

            if (!field.isSlug && field.setDefaultTranslationInModel) {
                // return `${modelAlias}.${field.varName} = '${postedFields[field.varName][LanguageService.defaultLanguage()]}'`;
            }

            if (field.isSlug && !field.slugFrom) {
                const value = (field.translatable) ? postedFields[field.varName][defaultLang as any] : postedFields[field.varName];
                return `${modelAlias}.${field.varName} = '${value}', ${modelAlias}.slug = '${slug(value, {lower: true})}'`;
            }

            const slugFromFieldIdx = findIndex(fields, {varName: (!field.slugFrom) ? field.varName : field.slugFrom});
            if (slugFromFieldIdx === -1) {
                return '';
            }

            const slugFromField = fields[slugFromFieldIdx];
            if (slugFromField.translatable) {
                // return `${modelAlias}.${field.varName} = '${slug(postedFields[slugFromField.varName][LanguageService.defaultLanguage()], {lower: true})}'`;
            }

            return `${modelAlias}.${field.varName} = '${slug(postedFields[slugFromField.varName], {lower: true})}'`

        })
        .filter(part => typeof part !== 'undefined' && part !== undefined)
        .filter(part => part && part !== '')
    );

    // console.log(queryParts)


    queryParts.push(`${modelAlias}.updatedAt = datetime()`)

    return queryParts.join(', ');
}
