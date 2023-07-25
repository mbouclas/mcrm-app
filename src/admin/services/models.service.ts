import { Injectable } from '@nestjs/common';
import { Neo4jService } from "../../neo4j/neo4j.service";
import { sortBy, unionBy } from "lodash";
import { AppStateActions, store } from "../../state";
import { BaseModel } from "../../models/base.model";
import { McmsDiContainer } from "../../helpers/mcms-component.decorator";
import { ModelGeneratorService } from "./model-generator.service";
import { OnEvent } from "@nestjs/event-emitter";
import { SharedEventNames } from "~shared/shared.module";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IGenericObject } from "~models/general";
const debug = require('debug')('mcms:models:service');

@Injectable()
export class ModelsService extends BaseNeoService {
  jsonStringProperties = [
    'itemSelectorConfig',
    'listSelectorConfig',
    'locationSelectorConfig',
    'treeSelectorConfig',
    'options',
    'settings',

  ];




  @OnEvent(SharedEventNames.CONFIG_LOADED)
  async onConfigLoaded({ name, config }) {
    if (config['models']) {
      await (new ModelsService()).processModelsFromConfigQueue(config['models'])
    }
  }

  async mergeModels() {
    // First add the models on file to the store
    McmsDiContainer.all().filter(model => model.type === 'model').forEach(model => {
      AppStateActions.setModel(model.id, model.reference);
    });

    const res = await this.getModels();
    const temp: any = {};
    for (let idx = 0; res.records.length > idx; idx++) {
      const record = res.records[idx];
      let model = Neo4jService.parseNeoProperties(record.get('model')).properties;
      const fields = record.get('fields');
      const filterFields = record.get('filterFields');

      if (!Array.isArray(model.fields)) {
        model.fields = [];
      }

      if (!Array.isArray(model.filterFields)) {
        model.filterFields = [];
      }


      if (Array.isArray(fields) && fields.length > 0 && fields[0].field) {
        model.fields = sortBy(fields
          .filter(f => !f.properties.properties.isOnlyFilter)
          .map(f => {
            const props = f.properties.properties;
            for (let key in props) {
              const prop = props[key];
              if (this.jsonStringProperties.indexOf(key) !== -1) {
                try {
                  props[key] = JSON.parse(prop);
                }
                catch (e) {
                  // console.log('Cound not parse JSON for settings', key)
                }
              }
            }

            return Neo4jService.parseNeoProperties(Object.assign({}, f.field.properties, props));
          }),'order');
      }



      if (Array.isArray(filterFields) && filterFields.length > 0 && filterFields[0].field) {
        model.filterFields = sortBy(filterFields.map(f => {
          const props = f.properties.properties;

          for (let key in props) {
            const prop = props[key];
            // Do not merge overrides that have no value if the parent has one
            if (['label','placeholder'].indexOf(key) !== -1 && (prop.length === 0 && f.field.properties[key].length > 0)) {
              delete props[key];
            }
            if (this.jsonStringProperties.indexOf(key) !== -1) {
              try {
                props[key] = JSON.parse(props[key]);
              }
              catch (e) {
                // console.log('Cound not parse JSON for filter', key)
              }
            }
          }

          return Neo4jService.parseNeoProperties(Object.assign({}, f.field.properties, props));
        }), 'order');
      }

      // There's no file for this model. It only exists on the db
      if (model.isDynamic) {
        let m = (new ModelGeneratorService(model)).staticClass; //This won't work cause there's one BaseModel class and changing the statics in a loop just uses 1 class. We need a truly dynamic class
        AppStateActions.setModel(model.name, m);
        continue;
      }

      const modelClass = McmsDiContainer.model(model.name);
      // For some reason this model has no file, yet it was not declared as dynamic. Treat it as one
      if (!modelClass) {
        debug('----', model.name, '-----')
        // load the model into the store
        let m = (new ModelGeneratorService(model)).staticClass; //This won't work cause there's one BaseModel class and changing the statics in a loop just uses 1 class. We need a truly dynamic class
        AppStateActions.setModel(model.name, m);
        continue;
      }

      // console.log(model)
      // find the model as a class and do a merge with the db data
      model = this.mergeDbDataWithModel(model, modelClass);
      AppStateActions.setModel(model.modelName, model);
      temp[model.modelName] = model;
    }
  }

  async getModels() {
    const query = `MATCH (model:Model)
        OPTIONAL MATCH (model)-[rd:HAS_DYNAMIC_FIELD]-(field:DynamicField)
        OPTIONAL MATCH (model)-[rf:HAS_FILTER_FIELD]-(filterField:DynamicField)
        RETURN model, collect(distinct {field: field, properties: rd}) as fields, 
        collect(distinct {field: filterField, properties: rf}) as filterFields`;

    return this.neo.read(query);
  }

  private mergeDbDataWithModel(dbModel: BaseModel, fileModel: BaseModel) {
    // Merge fields

    if (Array.isArray(dbModel['fields']) && dbModel['fields'].length > 0) {
      fileModel['fields'] = unionBy(dbModel['fields'], fileModel['fields'], 'varName')
    }

    if (Array.isArray(dbModel['filterFields']) && dbModel['filterFields'].length > 0) {
      fileModel['filterFields'] = unionBy(dbModel['filterFields'], fileModel['filterFields'], 'varName')
    }

    if (typeof dbModel['relationships'] === 'object' && Object.keys(dbModel['relationships']).length > 0) {
      fileModel['modelConfig']['relationships'] = Object.assign({}, dbModel['relationships'], fileModel['modelConfig']['relationships']);
    }


    // Merge some properties
    this.jsonStringProperties.forEach(prop => {
      if (!dbModel[prop]) {return;}
      fileModel[prop] = dbModel[prop];
    });

    return fileModel;
  }

  async processModelsFromConfigQueue(models: IGenericObject[]) {

    for (let modelName in models) {
      await this.mergeModelsFromConfig(modelName, models[modelName]);
    }
  }


  async mergeModelsFromConfig(modelName: string, model: IGenericObject) {
    const service = new ModelsService();
    const baseModel = store.getState().models[modelName];
    if (!baseModel) {
      console.log('Model not found', modelName);
      return;
    }
    const mergedModel = service.mergeDbDataWithModel(model as BaseModel, baseModel as any)
    AppStateActions.setModel(modelName, mergedModel as any);
  }
}
