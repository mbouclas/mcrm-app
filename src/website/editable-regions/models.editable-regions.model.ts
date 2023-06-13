import { BaseModel } from "~models/base.model";
import { IGenericObject } from "~models/general";
export interface IEditableRegion {
  uuid: string;
  layout: string;
  region: string;
  executor?: string;// The executor name as string. You get it from the container
  items: IEditableRegionItem[];
  settings: IGenericObject;
}

export interface IEditableRegionItem {
  model: string;// The model name as string. You get it from the container
  settings?: IGenericObject;
  modelSettings?: IEditableRegionItemModelSettings;
  item: IEditableRegionItemReference;
}

export interface IEditableRegionItemModelSettings {
  limit?: number;
  orderBy?: string;
  way?: 'ASC'|'DESC';
  filter?: IGenericObject;
  filterKey?: string;
  rels?: string[];
}

export interface IEditableRegionItemReference {
  uuid?: string;
  title: string;
  slug?: string;
  metaData?: IGenericObject;
  settings?: IGenericObject;
}

export interface ISiteRegionConfig {
  name: string;
  settings: ISiteRegionConfigSettings;
  sections: ISiteRegionConfigSection[];
}

export interface ISiteRegionConfigSection {
  name: string;
  label: string;
  type: 'generic'|'class';
  allow?: 'item'|'category'[];
  settings?: ISiteRegionConfigSectionSettings;
  items: ISiteRegionItem[];
}

export interface ISiteRegionItem {
  uuid: string;
  name: string;
  module: string;
  image?: ISiteRegionImage;
  model: typeof BaseModel;
  type: BaseModel["modelName"];
  href?: string;
  linkTitle?: string;
  info?: () => any;
}


export interface ISiteRegionImage {
  href: string;
  alt: string;
  title: string;
  caption?: string;
  url: string;
  srcSet?: string[];
}

export interface ISiteRegionConfigSectionSettings {
  maxItems?: number;
  itemSelector?: ISiteRegionConfigSectionItemSelectorSettings;
}

export interface ISiteRegionConfigSectionItemSelectorSettings {
  allow: string[];
}

export interface ISiteRegionConfigSettings {
  use: 'redis'|'es'|'db'|'file'
}
