import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
const slug = require('slug');
export interface IZodSchema {
  type: string;
  properties: Properties;
  required?: string[] | null;
  additionalProperties: boolean;
  $schema: string;
}
export interface IZodProperty {
  type: string;
  description: string;
}
export interface Properties {
  [key: string]: IZodProperty;
}

export function moneyFormat(number: number) {
  return new Intl.NumberFormat('en-EL', { style: 'currency', currency: 'EUR' }).format(number);
}

export interface TreeNode {
  metaData: string;
  createdAt: Date;
  title: string;
  uuid: string;
  slug: string;
  updatedAt: Date;
  parentId?: string;
  children?: TreeNode[];
}

export function createNestedArray(nodes: TreeNode[], sortByKey = 'order'): TreeNode[] {
  // Validate sort attribute
  // if (!nodes.every(node => sortByKey in node)) throw new Error(`Sort attribute: ${sortByKey} does not exist in every node`);

  const nodeMap = new Map<string, TreeNode>();
  const result: TreeNode[] = [];
  // Initialize the map and result array
  nodes.forEach(node => {
    nodeMap.set(node.uuid, { ...node, children: [] });
    if (!node.parentId) {
      result.push(nodeMap.get(node.uuid)!);
    }
  });
  // Build the tree by assigning children to their parents
  nodes.forEach(node => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children!.push(nodeMap.get(node.uuid)!);
      }
    }
  });

  // Sorts nodes recursively based on sortByKey parameter
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => a[sortByKey] - b[sortByKey]);
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  }

  sortNodes(result);

  return result;
}


export function setupModelFromFields<T>(model: T, fields: IDynamicFieldConfigBlueprint[]): T {
  fields.forEach(field => {

    if (['json', 'nested'].indexOf(field.type) !== -1  && typeof model[field.varName] === 'undefined') {
      model[field.varName] = setupModelFromFields({}, field.fields || []);
    }

    model[field.varName] = getModelValueFromFieldSchema(field, model[field.varName]);

    if (field.isSlug && field.slugFrom && model[field.slugFrom]) {
      model[field.varName] = slug(model[field.slugFrom], {lower: true});
    }

    if (field.schema) {
      schemaToFields(field.schema as IZodSchema).forEach(f => {
        if (model[field.varName][f.varName]) {return;}
        model[field.varName][f.varName] = getModelValueFromFieldSchema(f, model[field.varName][f.varName]);
      });
    }
  });

  return model;
}

export function getModelValueFromFieldSchema<T>(field: IDynamicFieldConfigBlueprint, value: any) {
  switch (field.type) {
    case 'boolean':
    case 'switch':
    case 'toggle':
      return typeof value === 'boolean' ? value : false;
    case 'array':
      return Array.isArray(value) ? value : [];
    case 'json':
    case 'nested':
    case 'image':
    case 'file':
      return typeof value === 'object' ? value : {};
    case 'date':
      return value ? new Date(value) : new Date();
    default:
      return value || '';
  }
}

export function schemaToFields(schema: IZodSchema) {
  if (!schema) {return  [];}
  const fields = [];

  for (let key in schema.properties) {
    const property = schema.properties[key];
    if (property.description && property.description.indexOf('json:') !== -1) {
      const json = JSON.parse(property.description.replace('json:', ''));

      for (let k in json) {
        property[k] = json[k];
      }
    }

    const field = {
      varName: key,
      label: property['label'] || key,
      hint: property['hint'] || property.description || '',
      placeholder: property['placeholder'] || '',
      type: property.type,
      required: schema.required && schema.required.indexOf(key) > -1,
      default: property['default'] || undefined,
      options: property['options'] || [],
    };

    if (['nested', 'json'].indexOf(field.type) !== -1 && property['properties']) {
      field['fields'] = schemaToFields(property as unknown as IZodSchema);
    }

    fields.push(field);
  }

  return fields;
}
