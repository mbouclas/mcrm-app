import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { OnEvent } from "@nestjs/event-emitter";
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { IBaseFilter } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import { findIndex } from "lodash";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";

@Injectable()
export class ProductCategoryService extends BaseNeoTreeService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'productCategory.model.updated';
  static createdEventName = 'productCategory.model.created';
  static deletedEventName = 'productCategory.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.ProductCategory;
    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new ProductCategoryService();
    // const r = await s.findAncestors('05e7a5f1-6fe8-4360-b566-afa0b4b79b14');
    // const r = await s.findDescendants('0bc0a5c5-8ee8-495c-8851-d673f1129f4f');
    // const r = await s.getParentAndChildren('0bc0a5c5-8ee8-495c-8851-d673f1129f4f');
    // const r = await s.getRootTree();
    // const r = await s.getCategoriesByModel('Product', {slug: 'test'})
    // const r = await s.addChildToParent({slug: 'winter'}, {slug: 'test'})
    // console.log(r)
  }

  // Need to use this.model
  async getCategoriesByModel(model: string,  filter: IBaseFilter) {
    const {key, value} = extractSingleFilterFromObject(filter);

    const query = `MATCH (model:${model}) WHERE model.${key} =~ $value
        WITH model
        MATCH (model)-[:HAS_CATEGORY]->(type:ProductCategory) return type`;
    const result = await this.neo.readWithCleanUp(query,{value});

    if (result.length === 0) {
      return [];
    }

    const items: ProductCategoryModel[] = [];
    result.forEach((record:any) => {
      const type = record.type;

      let itemsIdx = findIndex(items, {uuid: type.uuid} as any);
      if (itemsIdx == -1) {
        items.push(type);
        itemsIdx = items.length -1;
      }

    });

    return items;
  }
}
