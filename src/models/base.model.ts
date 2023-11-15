import { IDynamicFieldConfigBlueprint } from '../admin/models/dynamicFields';
import { IGenericObject, IPagination } from './general';
import { IQueryBuilderFieldBlueprint } from '../shared/models/queryBuilder';
import { IRelationshipToInject } from '../admin/services/model-generator.service';
import { findIndex } from 'lodash';
import { IItemSelectorConfig } from '~models/item-selector';
import { Logger } from '@nestjs/common';
import { getStoreProperty } from "~root/state";
import { z, ZodError } from "zod";
import { NoValidationSchemaFoundException } from "~models/exceptions/no-validation-schema-found.exception";
import { MissingRequiredModelFieldsException } from "~models/exceptions/missing-required-model-fields.exception";
import { transformErrors } from "~helpers/validateData";
import { setupModelFromFields } from "~helpers/data";
const slug = require('slug');

export interface IBaseModelFilterConfig {
  results_per_page?: number;
  allowMultiple?: boolean;
  maxSelectedItems?: number;
  minSelectedItems?: number;
  useSelectorComponent?: boolean;
  useQueryBuilderComponent?: boolean;
  executeOnLoad?: boolean;
  filterParamName?: string;
  minNumberOfCharacterForSearch?: number;
  maxNumberOfCharacterForSearch?: number;
  defaultOrderBy?: string;
  defaultWay?: string;
}

export interface INeo4jModel {
  select: string;
  as: string;
  deleteRules?: any;
  relationships: IGenericObject<INeo4jModelRelationshipConfig>;
}

export interface IModelFilters {
  allowMultiple?: boolean;
  type?: 'normal'|'inverse';
  allowedFields?: string[];
}

export interface INeo4jModelRelationshipConfig {
  alias: string;
  postProcessing?: Function;
  rel: string;
  model: string;
  modelAlias: string;
  exactAliasQuery?: boolean;
  type: 'inverse' | 'normal';
  isCount?: boolean;
  isCollection: boolean;
  isSortable?: boolean;
  isSortableCount?: boolean;
  sortableCountDefaultAlias?: string;
  orderByKey?: string;
  defaultProperty?: string;
  relKey?: string;
  isTree?: boolean;
  isMultilingual?: boolean;
  addRelationshipData?: boolean;
  tabs?: string[];
  group?: string;
  fields?: IDynamicFieldConfigBlueprint[];
  filters?: IModelFilters;
  match?: 'exact'|'optional'
}

export interface IBaseModelFieldGroup {
  name: string;
  label: string;
  type: 'group' | 'repeater';
  description: string;
  fields?: (string)[] | null;// just the varName of the field
  groupSettings?: IGenericObject;
  settings?: IGenericObject;
  metaData?: IGenericObject;
}

export class BaseModel {
  protected readonly logger = new Logger(BaseModel.name);
  public static modelName: string;
  public modelName: string;
  public name;
  public uuid?: string;
  public slug?: string;

  public static modelConfig: INeo4jModel;
  public static fields: IDynamicFieldConfigBlueprint[] = [];
  public slugPattern = '';
  public static itemSelector?: IItemSelectorConfig;
  public static filterFields: IQueryBuilderFieldBlueprint[] = [];
  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
  public static fieldGroups: IBaseModelFieldGroup[] = [
  ];

  public static injectRelationships:
    | IGenericObject<IRelationshipToInject>
    | string;

  constructor() {
    this.assignModelFieldsToGroups();

    setTimeout(() => {
      this.loadModelSettingsFromConfig();
    }, 1000);


  }

  public set(obj: IGenericObject) {
    for (let key in obj) {
      this[key] = obj[key];
    }

    return this;
  }

  getFields() {
    return (this.constructor as typeof BaseModel).fields;
  }

  hasField(field: string) {
    return this.hasOwnProperty(field);
  }

  setFieldProperty(field: string, property: string, value: any) {
    this[field][property] = value;
  }

  public static isFieldSortable(
    field: string,
    fields: IDynamicFieldConfigBlueprint[],
  ) {
    return findIndex(fields, { varName: field, isSortable: true }) !== -1;
  }

  public static isFieldSortableCount(
    field: string,
    relationships: INeo4jModelRelationshipConfig,
  ) {
    // @ts-ignore
    const found =
      Object.keys(relationships).filter(
        (key) => key === field && relationships[key].isSortableCount,
      ).length > 0;
    if (found) {
      return true;
    }
    // Try out for aliases
    return BaseModel.getSortableCountField(field, relationships);
  }

  public static getSortableCountField(
    field: string,
    relationships: INeo4jModelRelationshipConfig,
  ) {
    // @ts-ignore
    const fields = Object.keys(relationships).filter(
      (key) =>
        field &&
        relationships[key].isSortableCount &&
        field === relationships[key].sortableCountDefaultAlias,
    );
    if (fields.length === 0) {
      return false;
    }

    return fields[0];
  }

  public static groupModelFields() {
    console.log(this.fields)
  }

  assignModelFieldsToGroups() {
    const model = this.constructor as typeof BaseModel;

    if (!model.fieldGroups || !Array.isArray(model.fieldGroups)) {
      model.fieldGroups = [];
      return;
    }

/*    model.fieldGroups.forEach((group) => {
      if (!Array.isArray(group.fields)) {
        group.fields = [];
      }

      group.fields = model.fields
        .filter((field) => field.varName === group.name)
        .map((field) => {
          return field.varName;
        });

    });*/


  }

  /**
   * Apply any settings found on the config file
   */
  loadModelSettingsFromConfig() {
    const modelSettings = getStoreProperty(`configs.general.modelSettings.${this.modelName}`);
    for (const key in modelSettings) {
      this[key] = modelSettings[key];// assign as instance property
      this.constructor[key] = modelSettings[key];// assign as static property
    }
  }

  toModel(obj: IGenericObject) {
    if (!this.constructor['validationSchema']) {
      throw new NoValidationSchemaFoundException('NO_VALIDATION_SCHEMA_FOUND', '999.998', {modelName: this.constructor['modelName']});
    }

    try {
      this.constructor['validationSchema'].parse(obj)
    }
    catch (e) {
      if (e instanceof ZodError) {
        throw new MissingRequiredModelFieldsException('MISSING_REQUIRED_MODEL_FIELDS', '999.999', {modelName: this.constructor['modelName'], errors: transformErrors(e)});
      }
    }


    for (const key in this.constructor['validationSchema'].shape) {
      if (obj.hasOwnProperty(key)) {
        this[key] = obj[key];
      }
    }

    return this;
  }

  toObject() {
    const obj = setupModelFromFields({}, this.constructor['fields']);

    this.constructor['fields'].forEach((field) => {
      if (this[field.varName]) {
        obj[field.varName] = this[field.varName];
      }
    });

    return obj;
  }

  slugifyProperty(from: string, property: string) {
    this[property] = slug(this[from], {lower: true});

    return this;
  }

  static toSlug(str: string) {
    return slug(str, {lower: true});
  }
}
