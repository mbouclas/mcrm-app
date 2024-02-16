import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IGenericObject, IPagination } from "~models/general";
import { BusinessModel } from "../models/business.model";
import { store } from "~root/state";
import { ImageService } from "~image/image.service";
import { BaseNeoService, IBaseNeoServiceRelationships } from "~shared/services/base-neo.service";
import { getHooks } from "~shared/hooks/hook.decorator";
import { SharedModule } from "~shared/shared.module";
import { ProductEventNames } from "~catalogue/product/services/product.service";



export class BusinessModelDto {

}

export enum BusinessEventNames {
  businessCreated = 'businessCreated',
  businessUpdated = 'businessUpdated',
  businessDeleted = 'businessDeleted',
  bulkUpdate = 'bulkUpdate',
  businessImportDone = 'businessImportDone',
}

@McmsDi({
  id: 'BusinessService',
  type: 'service'
})
@Injectable()
export class BusinessService extends BaseNeoService {
  protected relationships = [];
  protected moduleName = 'crm';
  private modelName = 'Business';
  protected model: typeof BusinessModel;
  protected imageService: ImageService;

  constructor() {
    super();
    this.model = store.getState().models.Business as typeof BusinessModel;

    this.imageService = new ImageService();
  }

  async findOne(filter: IGenericObject, rels = []): Promise<BusinessModel> {
    let item: BusinessModel;
    const hooks = getHooks({ category: 'Business' });

    if (hooks && typeof hooks.findOneBefore === 'function') {
      await hooks.findOneBefore(filter, rels);
    }

    try {
      item = (await super.findOne(filter, rels)) as unknown as BusinessModel;
    } catch (e) {
      throw e;
    }


    if (!item['thumb'] || !item['thumb']?.url) {
      const images = await this.imageService.getItemImages('Business', item['uuid']);
      item['thumb'] = images.find((img) => img.type === 'main') || null;
    }


    if (hooks && typeof hooks.findOneAfter === 'function') {
      item = await hooks.findOneAfter(item);
    }

    return item;
  }

  async find(params: IGenericObject = {}, rels: string[] = []): Promise<IPagination<BusinessModel>> {
    let res;

    try {
      res = await super.find(params, rels);
    } catch (e) {
      throw e;
    }

    return res;
  }

  async store(record: Partial<BusinessModel>, userId?: string, relationships: IBaseNeoServiceRelationships[] = []) {
    const hooks = getHooks({ category: 'Business' });

    if (hooks && typeof hooks.storeBefore === 'function') {
      await hooks.storeBefore(record, relationships);
    }


    let r = await super.store(record, userId, relationships);
    // Add changelog?

    if (hooks && typeof hooks.storeAfter === 'function') {
      r = await hooks.storeAfter(r);
    }

    SharedModule.eventEmitter.emit(BusinessEventNames.businessCreated, r);
    return r;
  }
}
