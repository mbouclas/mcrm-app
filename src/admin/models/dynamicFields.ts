export interface IDynamicFieldConfigSettingsBluePrint {

}

export interface IDynamicFieldConfigPasswordSettingsBluePrint extends IDynamicFieldConfigSettingsBluePrint {
    confirmRequired: boolean;
}

export interface IDynamicFieldConfigImageSettingsBluePrint extends IDynamicFieldConfigSettingsBluePrint {
    width?: number;
    height?: number;
    quality?: number;
}

export interface IDynamicFieldConfigSelectSettingsBluePrint extends IDynamicFieldConfigSettingsBluePrint {
    multiple: boolean;
}

export interface IDynamicFieldSelectOption {
    label: string;
    value: string|null;
    default?: boolean;
}

export interface IDynamicFieldItemSelectorConfig {
    module: string;
    multiple?: boolean;
    slices?: string[];
    tabs?: string[];
    resultDisplayField?: string;// What to show once a value of object was selected
    translatable?: boolean; // If it's a translatable field show default translation
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
    exported?: boolean,
    isJson?: boolean;
    isSlug?: boolean;
    slugFrom?: string;
    setDefaultTranslationInModel?: boolean;
    isDisplayedColumn?: boolean;
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
    settings: {[key: string]: IDynamicFieldParamConfigBlueprint};
    config: {[key: string]: IDynamicFieldParamConfigBlueprint};
}
