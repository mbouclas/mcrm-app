import { IBaseTree, IGenericObject } from "./general";
import {IDynamicFieldConfigBlueprint} from "./dynamic-fields.model";
import {State} from "zustand";
import { IOauthToken } from "./auth";
import { BaseModel } from "./base.model";
// import { ISiteRegionConfig } from "../publisher/publisher.service";

export interface IUserPreferencesModel {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    firstVisit?: boolean;
    hasEnabled2Fa?: boolean;
    dashboardWidgets?: IWidgetFromDB[];
    dashboardColumns?: number;
    userTheme?: string;
    [key: string]: any;
}

export interface IWidgetFromDB {
    settings: IGenericObject;
    id?: string;
    name: string;
    x: number;
    y: number;
    rows: number;
    cols: number;
}

export interface IUserConfig {
    UserSettings?: {
        InitialScreen?: string;
    },
    dashboardWidgets?: IWidgetFromDB[];
    requiresPasswordChange?: boolean;
    [key: string]: any;
}

export interface IGate {
    uuid?: string;
    gate: string;
    level: number;
    name: string;
    description?: string;
    provider: string;
}

export interface IDbModelFieldFilters {
}


export interface IDbModelFieldSettings {
    exported: boolean;
    isJson: boolean;
    isSlug: boolean;
    isSortable: boolean;
    isDisplayedColumn: boolean;
    disabled: boolean;
    translatable: boolean;
    translateOn: string;
    order: number;
    group: string;
    slugFrom: string;
    // itemSelectorConfig: DynamicFieldItemSelectorConfig;
    // options: DynamicFieldSelectOption;
}

export interface DbModelModel {
    uuid: string;
    name: string;
    modelName: string;
    createdAt: Date;
    updatedAt: Date;
    fieldSettings: IDbModelFieldSettings;
    fieldFilters: IDbModelFieldFilters;
}

export interface IBaseNamedModel {
    uuid: string;
    name: string;
}

export interface ILanguage extends IBaseNamedModel{
    code: string;
}


export interface IMcmsComponent {
    name: string;
    label: string;
    model: string;
    description: string;
    config?: IGenericObject;
    lang?: IGenericObject;
}

export interface IExportProviderConfig {
    provider: string;
    label: string;
    description?: string;
    requiredFields?: IDynamicFieldConfigBlueprint[];
    icon?: string;
    requiresConfig: boolean;
    configurator?: IExportProviderConfigurator;
    driver: string;
}

export interface IExportProviderConfigurator {
    name: string;
}

export interface IHomePage {
    categoryTreeKey: string,
    slider: any[],
    featured: any[],
}

interface IMcrmAuthState {
    accessToken: string;
    cookie: string;
}

export interface AppStateModel extends State {
    finishedBooting: boolean;
    userPreferences: IUserPreferencesModel;
    gates: IGate[];
    models: {[key: string]: typeof BaseModel};
    languages: ILanguage[];
    defaultLanguage: ILanguage;
    defaultLanguageCode: string;
    activeComponents: IMcmsComponent[];
    exportProviders: IExportProviderConfig[];
    configs: {[key: string]: typeof BaseModel};
}
