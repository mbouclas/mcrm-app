import { IDynamicFieldItemSelectorConfig } from "../../admin/models/dynamicFields";


export interface IQueryBuilderNodeChild {
    field?: IQueryBuilderFieldBlueprint;
    constraint?: IQueryBuilderConstraintBlueprint;
    value?: any;
    operator?: string;
    isSelector?: boolean;
    children?: IQueryBuilderNodeChild[]
}

export interface IQueryBuilderNode {
    operator: string;
    isSelector?: boolean;
    children?: IQueryBuilderNodeChild[]
}

export interface IQueryBuilderFieldBlueprint {
    type: any;
    varName: string;
    label: string;
    placeholder?: string;
    model?: string;
    isSortable?: boolean;
    required?: boolean;
    filterType?: 'partial'|'exact';
    filterField?: string;
    translatable?: boolean;
    translateOn?: string;
    isInSimpleQuery?: boolean;
    order?: number;
    relName?: string;
    relType?: 'normal'|'inverse',
    match?: 'optional'|'exact',
    group?: string;
    itemSelectorConfig?: IDynamicFieldItemSelectorConfig;
    rangeFromFieldName?: string;
    rangeToFieldName?: string;
    isRange?: boolean;
    doNotReturnValues?: boolean;
    booleanOrNull?: boolean;
}

export interface IQueryBuilderConstraintBlueprint {
    varName: string;
    label: string;
    operator: string;
}

export interface IQueryBuilderFieldTypeBlueprint {
    varName: string;
    label: string;
    constraints: IQueryBuilderConstraintBlueprint[];
}
