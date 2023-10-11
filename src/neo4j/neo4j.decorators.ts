import "reflect-metadata";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { AppStateActions, store } from "~root/state";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";


const decoratedPropertiesKey = Symbol('decoratedProperties');
export const modelRegistry: Function[] = [];

export function McrmNeoService(modelName: string) {
  return function (constructor: Function) {
    constructor['modelName'] = modelName;
  }
}

export function McrmModel(modelName: string) {
  return function (constructor: Function) {
    constructor['modelName'] = modelName;
    if (!Array.isArray(constructor['fields'])) {
      constructor['fields'] = [];
    }

    if (!Array.isArray(constructor['filterFields'])) {
      constructor['filterFields'] = [];
    }

    const allProperties = getPropertiesWithMetadata(constructor);

    for (const property in allProperties) {
      if (allProperties.hasOwnProperty(property)) {
        const field = allProperties[property];
        field['name'] = property;
        constructor['fields'].push(field);
      }
    }

    modelRegistry.push(constructor);


    McmsDiContainer.add({
      type: 'model',
      id: modelName,
      reference: constructor,
    });
  }
}


export function Property(params: IDynamicFieldConfigBlueprint) {
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

export function FilterField(params: IQueryBuilderFieldBlueprint) {
  return function (target: any, propertyKey: string) {

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


export function getPropertiesWithMetadata(target: Function) {
  const properties = getDecoratedProperties(target);
  const allMetadata: { [property: string]: { [key: string]: any } } = {};

  for (const property of properties) {
    allMetadata[property] = getMetadataForProperty(target, property);
  }

  return allMetadata;
}

export function getDecoratedProperties(target: Function): string[] {
  return Reflect.getOwnMetadata(decoratedPropertiesKey, target.prototype) || [];
}

export function getMetadataForProperty(target: Function, propertyKey: string) {
  const metadataKeys = Reflect.getMetadataKeys(target.prototype, propertyKey);
  const metadata: { [key: string]: any } = {};

  for (const key of metadataKeys) {
    metadata[key] = Reflect.getMetadata(key, target.prototype, propertyKey);
  }

  return metadata;
}

export function getAllModels() {
  return modelRegistry;
}
