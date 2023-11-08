import { IGenericObject } from "~models/general";
import { filter, findIndex, find, sortBy, reverse } from "lodash";
import { Container } from "typedi";
import { IMcmsDiRegistryItem } from "~helpers/mcms-component.decorator";
import { zodToJsonSchema } from "zod-to-json-schema";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { getPropertiesWithMetadata } from "~neo4j/neo4j.decorators";
import { IDynamicFieldConfigBlueprint } from "~models/dynamic-fields.model";

const decoratedPropertiesKey = Symbol('importTemplatesDecoratedProperties');

export interface IMcrmImportTemplateRegistryItem {
  id: string;
  name: string
  type: string;
  reference?: any;
  description?: string;
  settings?: IGenericObject;
  settingsSchema?: IGenericObject;
  settingsFieldMap?: IDynamicFieldConfigBlueprint[];
  metaData?: IGenericObject;
}
export class ImportTemplateRegistry {
  static registry: IMcrmImportTemplateRegistryItem[] = [];

  static get (filter: IGenericObject): null|IMcrmImportTemplateRegistryItem {
    const idx = findIndex(this.registry, filter);
    if (idx === -1) {
      return null;
    }

    return this.registry[idx];
  }

  static add(obj: IMcrmImportTemplateRegistryItem) {
    if (this.registry.includes(obj)) {return;}
    this.registry.push(obj);
  }

  static getAndInstantiate<T = any>(filter: IGenericObject): null|T {
    const container = this.get(filter);
    if (!container) {return null;}

    // try to get the item from the DI registry. Need to have the same id as in the DI
    return container.reference;
  }

  static freshInstance(filter: IGenericObject) {
    const item = this.get(filter);
    if (!item) {return null;}

    // try to get the item from the DI registry. Need to have the same id as in the DI
    return Container.get(item.id);

  }

  static filter(filters: IGenericObject) {
    return filter(ImportTemplateRegistry.all(), filters) as IMcmsDiRegistryItem[];
  }

  static findOne(filters: IGenericObject) {
    return find(ImportTemplateRegistry.all(), filters) as IMcmsDiRegistryItem;
  }

  static all(forApiUse = false, sortField = 'title') {
    if (!forApiUse) {
      return this.registry;
    }

    return sortBy(this.registry.map((item) => {
      return ImportTemplateRegistry.getProviderForApiUse(item.id, false)
    }), sortField);
  }

  static getProviderForApiUse(providerName: string, convertId = true) {
    const id = convertId ? `${providerName.charAt(0).toUpperCase() + providerName.slice(1)}Template` : providerName;
    const provider = ImportTemplateRegistry.findOne({id});
    if (!provider) {return null;}
    const shortName = provider.id.replace('Template', '').toLowerCase();

    return {
      ...provider.reference.metaData,
      ...{shortName},
      fieldMap: sortBy(provider.reference['fieldMap'], 'name')|| [],
      settingsSchema: provider.reference['settingsSchema'] ? zodToJsonSchema(provider.reference['settingsSchema']) : {},
      settingsFieldMap: provider.reference['settingsFieldMap'] || [],
      settings: provider.reference['settings'] || {},
    }

  }

}

export const McrmImportTemplate = (obj: IMcrmImportTemplateRegistryItem) => {
  return (constructor: Function) => {
    obj.reference = constructor;
    if (typeof obj.reference.metaData !== 'object') {
      obj.reference.metaData = {};
    }


    constructor['fieldMap'] = [];

    const allProperties = getPropertiesWithMetadata(constructor, decoratedPropertiesKey);

    for (const property in allProperties) {
      if (allProperties.hasOwnProperty(property)) {
        const field = allProperties[property];
        field['name'] = property;
        constructor['fieldMap'].push(field);
      }
    }

    obj.reference.metaData = {
      ...obj.reference.metaData,
      ...{
        description: obj.description || undefined,
        title: obj.name || undefined,
        settings: obj.settings || undefined,
        settingsSchema: obj.settingsSchema,
        settingsFieldMap: obj.settingsFieldMap,
        id: obj.id || undefined,
        type: obj.type || undefined,
        metaData: obj.metaData || undefined,
      }
    };

    ImportTemplateRegistry.add({
      id: obj.id,
      reference: constructor,
      name: obj.name,
      type: obj.type,
      description: obj.description,
      settings: obj.settings,
      settingsSchema: obj.settingsSchema,
      settingsFieldMap: obj.settingsFieldMap,
      metaData: obj.metaData,
    });
  };
}


export function ImportTemplateField(params: IImportProcessorFieldMap) {
  return function (target: any, propertyKey: string) {
    // console.log(target.constructor.name);


    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        Reflect.metadata(key, params[key])(target, propertyKey);
      }
    }

    // Maintain a list of decorated properties
    let existingDecoratedProperties: string[] = Reflect.getOwnMetadata(decoratedPropertiesKey, target);
    if (!existingDecoratedProperties) {
      existingDecoratedProperties = [];
    }
    existingDecoratedProperties.push(propertyKey);
    Reflect.defineMetadata(decoratedPropertiesKey, existingDecoratedProperties, target);
  };
}
