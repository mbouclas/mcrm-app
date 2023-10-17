import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IGenericObject, IPagination } from "~models/general";
import { EditableRegionModel } from "~website/editable-regions/editable-region.model";
import {
  IEditableRegionItem,
  IEditableRegionItemReference
} from "~website/editable-regions/models.editable-regions.model";
import { ModelRestructureService } from "~website/editable-regions/model-restructure.service";
import {  McmsDi, McmsDiContainer } from "~helpers/mcms-component.decorator";
import { groupBy } from "lodash";
import { zodToJsonSchema } from "zod-to-json-schema";
import { IDynamicFieldConfigBlueprint } from "~models/dynamic-fields.model";
import { resolve } from "path";
import { writeFile } from "fs/promises";
import { loadConfigs } from "~helpers/load-config";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";

export interface IEditableRegionSettings extends IGenericObject {

}
export interface IEditableRegion {
  name: string;
  label: string;
  type: 'group' | 'repeater' | 'executor';
  description: string;
  fields?: (IEditableRegionField)[] | null;
  allowedTypes?: string[] | null;
  regionSettings: IEditableRegionSettings;
  settings: IEditableRegionSettings;
  executor: string;
  metaData?: IGenericObject;
}
export interface IEditableRegionField extends IDynamicFieldConfigBlueprint {

}
export interface IEditableRegionLayout {
  name: string;
  label: string;
  description: string;
  type: string;
  regions?: (IEditableRegion)[] | null;
}

@McmsDi({
  id: 'EditableRegionsService',
  type: 'service',
})
@Injectable()
export class EditableRegionsService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.EditableRegion;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

  }

  async find(params: IGenericObject = {}, rels: string[] = []): Promise<IPagination<EditableRegionModel>> {
    let res: IPagination<EditableRegionModel>;
    try {
      res = await super.find(params, rels) as IPagination<EditableRegionModel>;
    }
    catch (e) {
      throw e;
    }

    if (res.total === 0) {
      return res;
    }

    for (let idx = 0; idx < res.data.length; idx++) {
      if (!res.data[idx].items || !Array.isArray(res.data[idx].items)) {
        continue;
      }

      if (res.data[idx].executor) {
        res.data[idx].items = await this.launchExecutor(res.data[idx].executor, res.data[idx].settings);
        continue;
      }

      res.data[idx] = await this.reConstructItems(res.data[idx]);
    }


    return res;
  }

  private async reConstructItems(data: EditableRegionModel) {
    for (let idx = 0; data.items.length > idx; idx++) {

      data.items[idx] = await this.reConstructItem(data.items[idx]);
    }

    return data;
  }

  private async reConstructItem(model: IEditableRegionItem) {
    // let's try and find the model first
    let reconstructionService: ModelRestructureService,
    rels = [],
    filterKey = 'uuid';

    // Non model items
    if (!model.model) {
      return model;
    }

    reconstructionService = new ModelRestructureService(model.model)

    if (model.modelSettings && model.modelSettings.rels) {
      rels = model.modelSettings.rels;
    }


    if (model.modelSettings && model.modelSettings.filterKey) {
      filterKey = model.modelSettings.filterKey;
    }


    const filter = {};
    filter[filterKey] = model.item[filterKey];

    try {
      model.item = await reconstructionService.neoService.findOne(filter, rels) as unknown as IEditableRegionItemReference;
    }
    catch (e) {
      console.log(e)
    }


    return model;
  }

  groupBy(groupByKey: string, data: EditableRegionModel[]) {
    return groupBy(data, groupByKey);
  }

  private async launchExecutor(executor: string, settings: IGenericObject = {}) {
    // try to get the executor from the container
    const container = McmsDiContainer.get({id: executor});

    if (!container) {
      return [];
    }

    const service = new container.reference();


    try {
      return await service.handle(settings);
    }
    catch (e) {
      console.log(`Error in EditableRegionsService Launch Executor: ${e.message}`);
      return [];
    }
  }

  async getExecutors() {
    const executors = McmsDiContainer.filter({type: 'executor', category: 'editableRegions'});

    return executors.map(executor => {
      return {
        id: executor.id,
        description: executor.description,
        type: executor.type,
        category: executor.category,
        settingsSchema: zodToJsonSchema(executor.reference.settingsSchema),
        metaData: executor.metaData,
      }
    });
  }

  async getLayouts() {
    const configFile = resolve('client-configs/editableRegions.js');

    // load from disk
    if (require.cache[configFile]) {
      // Delete the module from cache
      delete require.cache[configFile];
    }

    const res = require(configFile);

    if (!Array.isArray(res['editableRegions'])) {
      res['editableRegions'] = [];
    }

    return res['editableRegions'] as IEditableRegionLayout[];
  }

  async saveLayout(layout: IEditableRegionLayout) {
    const layouts = await this.getLayouts();
    const configFile = resolve('client-configs/editableRegions.js');
    const foundIdx = layouts.findIndex(l => l.name === layout.name);
    if (foundIdx === -1) {
      layouts.push(layout);
    } else {
      layouts[foundIdx] = layout;
    }

    const data = {
      editableRegions: layouts,
    }

    await writeFile(configFile, 'module.exports = ' + JSON.stringify(data, null, 2));
    await loadConfigs('client-configs', true);

    return layouts;
  }

  async saveRegion(filters: {layout: string, region: string}, data: any) {
    let region: EditableRegionModel;
    try {
      region = await this.findOne(filters) as EditableRegionModel;
    }
    catch (e) {
      region = await this.store({layout: filters.layout, region: filters.region, items: {}}) as EditableRegionModel;
    }

    try {
      return await this.update(region['uuid'], { items: data });
    }
    catch (e) {
      throw new RecordUpdateFailedException(`COULD_NOT_UPDATE_RECORD`, '200.1', `Could not update record: ${e.message}`);
    }

  }
}
