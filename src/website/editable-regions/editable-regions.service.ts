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

// Region Item example
/*[
  {
    "model": "Product",
    "item": {
      "uuid": "a03f3e4e-f053-4531-b96c-f5e4a3e4d1da",
      "title": "Mirfat",
      "slug": "mirfat"
    },
    "modelSettings": {
      "filterKey": "slug",
      "rels": [
        "variants"
      ]
    }
  },
  {
    "model": "ProductCategory",
    "item": {
      "uuid": "cd3300b7-83f2-4658-840c-fb9c096c917d",
      "title": "Masks & Hygiene",
      "slug": "masks-hygiene"
    }
  }
]*/

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
}
