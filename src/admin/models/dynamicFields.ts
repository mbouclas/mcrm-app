import { IGenericObject } from "~models/general";

export interface IDynamicFieldConfigSettingsBluePrint {}

export interface IDynamicFieldConfigPasswordSettingsBluePrint
  extends IDynamicFieldConfigSettingsBluePrint {
  confirmRequired: boolean;
}

export interface IDynamicFieldConfigImageSettingsBluePrint
  extends IDynamicFieldConfigSettingsBluePrint {
  width?: number;
  height?: number;
  quality?: number;
  maxFileSize?: number;
  fileLimit?: number;
  accept?: string; //File accept, same as form accept
  multiple?: boolean; //Select more than one image
  selectFromMediaLibrary?: boolean; //If true, we need to show the library tab
  showPreview?: boolean; //If true, show the uploaded image
  addFromUrl?: boolean; //If true, add a tab to paste a url and retrieve it
  defaultCopy?: string; //Which copy to show on the preview. By default, we show the first on the list
}

export interface IDynamicFieldConfigSelectSettingsBluePrint
  extends IDynamicFieldConfigSettingsBluePrint {
  multiple: boolean;
}

export interface IDynamicFieldSelectOption {
  label: string;
  value: string | null;
  default?: boolean;
}

export interface IDynamicFieldItemSelectorConfig {
  module: string;
  multiple?: boolean;
  slices?: string[];
  tabs?: string[];
  resultDisplayField?: string; // What to show once a value of object was selected
  translatable?: boolean; // If it's a translatable field show default translation
}

export interface IRangeSettings {
  from?: number;
  to?: number;
}

export interface IAggregationFieldSettings {
  name: string;
  field: string;
  boost?: number;
  multilingual?: boolean;
  type: 'nested' | 'simple' | 'range';
  key?: string;
  buckets?: string[]; //['name.keyword', 'slug']
  isKeyword: boolean;
  size: number;
  ranges?: IRangeSettings[];
}

export interface ISearchIndexSettings {
  isAutoCompleteField: boolean;
  aggregationFieldSettings?: IAggregationFieldSettings;
}

export interface IDynamicFieldConfigBlueprint<ISettingsType = {}> {
  varName: string;
  label: string;
  type: string;
  placeholder?: string;
  default?: any;
  translatable?: boolean;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  order?: number;
  options?: IDynamicFieldSelectOption[];
  itemSelectorConfig?: IDynamicFieldItemSelectorConfig;
  settings?: ISettingsType;
  isSortable?: boolean;
  exported?: boolean;
  isJson?: boolean;
  schema?: IGenericObject;
  isSlug?: boolean;
  slugFrom?: string;
  setDefaultTranslationInModel?: boolean;
  isDisplayedColumn?: boolean;
  searchIndexSettings?: ISearchIndexSettings;
  imageSettings?: IDynamicFieldConfigImageSettingsBluePrint;
  fields?: IDynamicFieldConfigBlueprint[];
  isReadOnly?: boolean;
  [key: string]: any;
}

export interface IDynamicFieldParamConfigBlueprint {
  type: string;
  label: string;
  required: boolean;
  toSlug: string;
  multilingual: boolean;
}

export interface IDynamicFieldParamBlueprint {
  label: IDynamicFieldConfigBlueprint;
  varName: IDynamicFieldConfigBlueprint;
  placeholder: IDynamicFieldConfigBlueprint;
  description: IDynamicFieldConfigBlueprint;
  default: IDynamicFieldConfigBlueprint;
  required: IDynamicFieldConfigBlueprint;
  translatable: IDynamicFieldConfigBlueprint;
  step: IDynamicFieldConfigBlueprint;
  min: IDynamicFieldConfigBlueprint;
  max: IDynamicFieldConfigBlueprint;
  options: {
    params: IDynamicFieldConfigBlueprint;
    label: IDynamicFieldConfigBlueprint;
    value: IDynamicFieldConfigBlueprint;
  };
}

export interface IDynamicFieldBlueprint {
  label: string;
  type: string;
  params: IDynamicFieldParamBlueprint;
  settings: { [key: string]: IDynamicFieldParamConfigBlueprint };
  config: { [key: string]: IDynamicFieldParamConfigBlueprint };
}
