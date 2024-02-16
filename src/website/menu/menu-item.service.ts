import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { MenuItemModel } from "~website/menu/models/menu-item.model";
import { IBaseNeoServiceRelationships } from "~shared/services/base-neo.service";
import { IGenericObject } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import { createNestedArray } from "~helpers/data";
import { PermalinkBuilderService } from "~website/menu/permalink-builder.service";
import { BaseException } from "~root/exceptions/base.exception";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";
import { fromRecordToModel } from "~helpers/fromRecordToModel";



@Injectable()
export class MenuItemService extends BaseNeoTreeService {
  constructor() {
    super();
    this.model = store.getState().models.MenuItem;
  }

/*  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new MenuItemService();
    setTimeout(async () => {
      // const r = await s.getRootTree();
      // const r = await s.findAncestors('05e7a5f1-6fe8-4360-b566-afa0b4b79b14');
      // console.log(r);
    }, 1000);
  }*/

  async storeAndLinkToMenu(menuId: string, model: Partial<MenuItemModel>, relationships?: IBaseNeoServiceRelationships[]) {
    let res;

    if (!model['type']) {
      model['type'] = model['model'] ? 'object' : 'custom';
    }

    if (!model['slug']) {
      model['slug'] = MenuItemModel.toSlug(model['title']);
    }

    if (model['model'] && (!model['permalink'] || model['permalink'].length === 0)) {
      model['permalink'] = new PermalinkBuilderService().build(model['model'], model);
    }

    if (!model['order']) {
      // await this.neo.readWithCleanUp(`MATCH (m:Menu {uuid: $menuId})-[:HAS_CHILD]->(i:MenuItem) RETURN count(i) as count`, {menuId})
    }


    try {
      res = await this.store(model);
    }
    catch (e) {
      throw e;
    }

    const parentRel = relationships?.find(r => r.name === 'parent');
    if (parentRel) {
      try {
        await this.attachModelToAnotherModel(MenuItemModel as any, MenuItemModel as any, {uuid: res.uuid}, {uuid: parentRel.id}, 'parent');
        return res;
      }
      catch (e) {
        console.log(`Failed to attach menu item to parent: ${e.message}`, e);
      }
    }

    const query = `
      MATCH (m:Menu {uuid: $menuId})
      MATCH (i:MenuItem {uuid: $uuid})
      MERGE (m)-[r:HAS_CHILD]->(i)
      ON CREATE SET r.createdAt = datetime()
      ON MATCH SET r.updatedAt = datetime()
    `;

    try {
      await this.neo.write(query, {menuId, uuid: res.uuid});
    }
    catch (e) {
      throw e;
    }

    return res;
  }

  async getMenuItemsTree(menuFilter: IGenericObject) {
    const {key, value} = extractSingleFilterFromObject(menuFilter);
    const query = `
    MATCH (m:Menu {${key}: '${value}'})-[:HAS_CHILD*1..]->(child:MenuItem)
    WITH m, child
    OPTIONAL MATCH (parent)-[:HAS_CHILD]->(child)
    WHERE parent:MenuItem 
    RETURN child AS node, 
       
       CASE WHEN parent IS NULL OR (m)-[:HAS_CHILD]->(child) THEN NULL ELSE parent.uuid END AS parentId
    `;

    const res = await this.neo.readWithCleanUp(query);



    return createNestedArray(res.map(n => ({...fromRecordToModel(n.node, this.model), parentId: n.parentId})));

  }

  /**
   * Convert an object to a menu item
   * @param modelName
   * @param body
   * @param type
   */
  async toMenuItem(modelName: string, body: IGenericObject, type: 'object' | 'custom' = 'object') {
    const model = new MenuItemModel().toModel({ ...{model: modelName}, ...body });

    model['model'] = modelName;
    model.slugifyProperty('title', 'slug');
    model['permalink'] = new PermalinkBuilderService().build(modelName, model);
    model['type'] = type;
    model['itemId'] = body.uuid;

    return model.toObject();
  }

  async addMenuItemChildren(menuId: string, item: Partial<MenuItemModel>, modelName: string) {
    if (!Array.isArray(item.children)) {
      throw new RecordUpdateFailedException('CHILDREN_NOT_ARRAY', '3250');
    }
    const failedInserts = [];

    for (let idx = 0; item.children.length > idx; idx++) {
      try {
        const menuItem = await this.toMenuItem(modelName, item.children[idx]);
        await this.storeAndLinkToMenu(menuId, menuItem, [{name: 'parent', id: item.uuid}])
      }
      catch (e) {
        failedInserts.push(item.children[idx]);
      }
    }

    if (failedInserts.length > 0) {
      throw new RecordUpdateFailedException('FAILED_INSERTS', '3251', {failedInserts});
    }

    return {success: true};

  }
}

