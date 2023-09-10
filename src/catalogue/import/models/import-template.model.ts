import { Injectable } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';

const modelName = 'ImportTemplate';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ImportTemplateModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  public static modelConfig: INeo4jModel = {
    select: 'importTemplate:ImportTemplate',
    as: 'importTemplate',
    relationships: {},
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'text',
      group: 'main',
    },
    {
      varName: 'type',
      label: 'Type',
      placeholder: 'Type',
      type: 'text',
      group: 'main',
    },

    {
      varName: 'processor',
      label: 'Processor',
      placeholder: 'Processor',
      type: 'text',
      group: 'main',
    },

    {
      varName: 'default',
      label: 'Default',
      placeholder: 'Default',
      type: 'boolean',
      isSortable: true,
      group: 'main',
    },

    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      type: 'text',
      group: 'hidden',
      isSlug: true,
      slugFrom: 'title',
    },
    {
      varName: 'fieldMap',
      label: 'FieldMap',
      placeholder: 'FieldMap',
      type: 'json',
      group: 'main',
    },
  ];
}
