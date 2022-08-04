import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IsNotEmpty } from "class-validator";
import { ITag, TagService } from "~tag/services/tag.service";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";

export class ProductModelDto {
  tempUuid?: string;
  uuid?: string;

  @IsNotEmpty()
  title?: string;

  categories?: ProductCategoryModel[];
  tags?: ITag[];
}

@Injectable()
export class ProductService extends BaseNeoTreeService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'product.model.updated';
  static createdEventName = 'product.model.created';
  static deletedEventName = 'product.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.Product;
    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    // const s = new ProductService();
    // const r = await s.findOne({slug: 'test'}, ['properties']);

    // console.log(r['property'][0])
  }

  async store(record: ProductModelDto, userId?: string) {
    const r = await super.store(record, userId);
    // Add changelog?

    return r;
  }

  async update(uuid:string, record:ProductModelDto, userId?:string) {
    // Handle Categories
    if (Array.isArray(record.categories)) {
      const productCategoryService = new ProductCategoryService();
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
}
