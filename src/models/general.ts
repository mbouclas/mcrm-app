export interface IGenericObject<T = any> {
    [key: string]: T;
}

export interface ITranslatableField {
    [key: string]: string|number|boolean;
}

export interface IBaseModel {
    uuid: string;
}
export interface IBaseTree extends IBaseModel {
    name: ITranslatableField;
    slug: string;
    description?: ITranslatableField;
    children?: IBaseTree[];
    code?: string;
}

export interface IBaseTree extends IBaseModel {
    name: ITranslatableField;
    slug: string;
    description?: ITranslatableField;
    children?: IBaseTree[];
    code?: string;
}

export interface IFacet extends IBaseModel{
    count: number;
    label: string;
    key: string;
    items: IBaseModel[];
}

export interface IPagination<T> {
    total:number;
    limit:number; // num of items to display
    skip?: number; // offset
    page?: number;
    pages?: number;
    facets?: IFacet[];
    data:T[];
}


export interface ITagModel {
    name: string;
    slug: string;
    uuid: string;
}

export interface IPaginatedQueryParams {
    limit?: number;
    per_page?: number;
    skip?: number;
    page?: number;
    query?: string;
    orderBy?: string;
    way?: string;
    [key: string]: any;
}

export interface IBaseTranslation {
    code: string;
    [key: string]: string;
}

export interface IBaseFilter {
    [key: string]: string|number|boolean
}


export interface IBaseMultiLingualField {
    [key: string]: string;
}
