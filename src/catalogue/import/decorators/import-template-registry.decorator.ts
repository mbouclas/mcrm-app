import { IGenericObject } from "~models/general";
import { findIndex } from "lodash";

export interface IMcrmImportTemplateRegistryItem {
  id: string;
  name: string
  type: string;
  reference?: any;
  description?: string;
  settings?: IGenericObject;
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

  static all() {
    return this.registry;
  }
}

export const McrmImportTemplate = (obj: IMcrmImportTemplateRegistryItem) => {
  return (cls: any) => {
    obj.reference = cls;
    ImportTemplateRegistry.add(obj);
  };
}
