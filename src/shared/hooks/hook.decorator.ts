import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IGenericObject } from "~models/general";

export function McrmHook(properties: { id: string, name?: string }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`Called method with id: ${properties.id} and name: ${properties.name}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function getHooks(filters: IGenericObject, constructorParams?: IGenericObject) {
  if (!filters['type']) {
    filters['type'] = 'hook';
  }

  const container = McmsDiContainer.getAndInstantiate(filters);
  if (!container) {
    return null;
  }

  if (!constructorParams) {
    return new container();
  }

  return new container(constructorParams);
}
