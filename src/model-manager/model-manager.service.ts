import { Injectable } from '@nestjs/common';
import {  writeFile } from "fs/promises";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { resolve } from "path";
import {  z } from "zod";
import { InvalidFieldStructureException } from "~root/model-manager/exceptions/invalid-field-structure.exception";
import { loadConfigs } from "~helpers/load-config";
import { IBaseModel } from "~models/general";
import { IBaseModelFieldGroup } from "~models/base.model";

@Injectable()
export class ModelManagerService {
  async onApplicationBootstrap() {
/*    setTimeout(async () => {
      const s = new ModelManagerService();
      try {
        await s.sync('Product',         {
          varName: 'pieces2',
          label: 'Pieces per box 2',
          placeholder: 'Pieces per box 3',
          type: 'number',
          group: 'extra',
          default: false,
          isSlug: false,
          isJson: false
        });
      }
      catch (e) {
        console.log(e);
      }
    }, 1000);*/
  }

  async sync(modelName: string, field: Partial<IDynamicFieldConfigBlueprint>) {
    modelName = modelName.replace('Model', '');
    const configFile = resolve('client-configs/models.js');
    try {
      this.validateField(field)
    }
    catch (e) {
      throw new InvalidFieldStructureException(`INVALID_FIELD_STRUCTURE`,'200.1', e.issues);
    }

    if (!field.default) {
      field.default = false;
    }

    if (!field.group) {
      field.group = 'main';
    }

    // read the models file
    if (require.cache[configFile]) {
      // Delete the module from cache
      delete require.cache[configFile];
    }

    const data = require(configFile);

    if (!data.models[modelName]) {
      data.models[modelName] = {
        fields: [],
        filterFields: [],
      };
    }

    if (!Array.isArray(data.models[modelName]['fields'])) {
      data.models[modelName]['fields'] = [];
    }

    const fields = data.models[modelName]['fields'];
    const foundIdx = fields.findIndex(f => f.varName === field.varName);
    if (foundIdx === -1) {
      fields.push(field);
    }
     else {
      fields[foundIdx] = field;
    }


    await writeFile(configFile, 'module.exports = ' + JSON.stringify(data, null, 2));
    await loadConfigs('client-configs', true);
  }

  validateField(field: Partial<IDynamicFieldConfigBlueprint>) {
    const schema = z.object({
      varName: z.string().min(1, 'Var name is required'),
      label: z.string().min(1, 'Label is required'),
      placeholder: z.string().min(1, 'Placeholder is required'),
      type: z.string().min(1, 'Type is required'),
    });



    return schema.parse(field);
  }

  async syncFieldGroups(modelName: string, groups: Partial<IBaseModelFieldGroup>[]) {
    modelName = modelName.replace('Model', '');
    const configFile = resolve('client-configs/models.js');

    // read the models file
    if (require.cache[configFile]) {
      // Delete the module from cache
      delete require.cache[configFile];
    }

    const data = require(configFile);

    if (!data.models[modelName]) {
      data.models[modelName] = {
        fields: [],
        filterFields: [],
      };
    }

    data.models[modelName]['fieldGroups'] = groups;

    await writeFile(configFile, 'module.exports = ' + JSON.stringify(data, null, 2));
    await loadConfigs('client-configs', true);

  }
}
