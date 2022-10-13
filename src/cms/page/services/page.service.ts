import { Injectable } from '@nestjs/common';
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IsNotEmpty } from "class-validator";
import { ITag, TagService } from "~tag/services/tag.service";
import { PageCategoryModel } from "~cms/page/models/page-category.model";
import { PageCategoryService } from "~cms/page/services/page-category.service";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { PageModel } from "~cms/page/models/page.model";
import { IBaseFilter, IGenericObject } from "~models/general";
import { ImageService } from "~image/image.service";

export class PageModelDto {
  tempUuid?: string;
  uuid?: string;

  @IsNotEmpty()
  title?: string;

  categories?: PageCategoryModel[];
  tags?: ITag[];
  slug?: string;
  active?: boolean;
}

@Injectable()
export class PageService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'product.model.updated';
  static createdEventName = 'product.model.created';
  static deletedEventName = 'product.model.deleted';
  protected imageService: ImageService;

  constructor() {
    super();
    this.model = store.getState().models.Page;


    this.changeLog = new ChangeLogService();
    this.imageService = new ImageService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new PageService();
/*
    const r = await s.findOne({slug: 'cretus'}, [
      // 'properties',
      // 'variants',
    ]);
    console.log(r)
*/
/*    const r = await s.generateVariantsFromProperty('e3b39b18-1a7a-4374-8d09-93f1fad349a1', [
      'a094c109-2adf-4ef8-ab19-aac83033ed6a',//red
      '616bce82-457a-4547-b56c-f80d81a13c7a',//blue
      '7afde04d-3c9b-4b13-b504-dff3f9b45472',//medium
      '6bbe2127-58ff-4e24-92a2-30ab15d77a8b',//large
    ])*/
    // const r = await s.find({limit: 2}, ['variants', 'properties'])
    // console.log(r)

    // await s.removeRelated({slug: 'betty'}, 'Product', {slug: 'trebol'})

  }

  async findOne(filter: IGenericObject, rels = []): Promise<PageModel> {
    const item = await super.findOne(filter, rels) as unknown as PageModel;

    return item;
  }

  async store(record: PageModelDto, userId?: string) {
    const r = await super.store(record, userId);
    // Add changelog?

    return r;
  }

  async update(uuid:string, record:PageModelDto, userId?:string) {
        // Handle Categories
    if (Array.isArray(record.categories)) {
      const pageCategoryService = new PageCategoryService();
      // await productCategoryService.
    }

    // Handle Tags
    if (Array.isArray(record.tags)) {
      // await
      const tagService = new TagService();
      await tagService.updateModelTags(uuid, record.tags, this.model.modelConfig);
    }

    // Handle properties

    // Handle images

  }

  /**
   * Given a property and it's values, generate product variants.
   * For example, generate variants for the colors blue and black.
   * The variants are links to the product that the user can edit their prices, quantities etc
   * Variants are generated as combos. If we select color + size, then we get variants like Red - SM, Red - M, Red - L
   * Variants are included in the product model but are not shown on search results
   * @param uuid
   * @param propertyValues
   */
  async addRelated(sourceFilter: IBaseFilter, destinationModelName: string, destinationFilter: IBaseFilter) {
    try {
      await this.attachModelToAnotherModel(store.getState().models['Page'], sourceFilter , store.getState().models[destinationModelName], destinationFilter, 'related');
    }
    catch (e) {
      console.log(e)
    }

    return this;
  }

  async removeRelated(sourceFilter: IBaseFilter, destinationModelName: string, destinationFilter: IBaseFilter) {
    const rel = store.getState().models['Page'].modelConfig.relationships['related'].rel;
    await this.detachOneModelFromAnother('Page', sourceFilter, destinationModelName, destinationFilter, rel);
  }

}
