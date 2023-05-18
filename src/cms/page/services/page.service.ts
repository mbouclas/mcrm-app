import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { IsNotEmpty } from 'class-validator';
import { ITag, TagService } from '~tag/services/tag.service';
import { PageCategoryModel } from '~cms/page/models/page-category.model';
import { PageCategoryService } from '~cms/page/services/page-category.service';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { PageModel } from '~cms/page/models/page.model';
import { IBaseFilter, IGenericObject } from '~models/general';
import { ImageService } from '~image/image.service';

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
  static updatedEventName = 'page.model.updated';
  static createdEventName = 'page.model.created';
  static deletedEventName = 'page.model.deleted';
  protected imageService: ImageService;

  constructor() {
    super();
    this.model = store.getState().models.Page;

    this.changeLog = new ChangeLogService();
    this.imageService = new ImageService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<PageModel> {
    const item = (await super.findOne(filter, rels)) as unknown as PageModel;
    item['images'] = await this.imageService.getItemImages('Page', item['uuid']);
    item['thumb'] = item['images'].find((img) => img.type === 'main') || null;

    return item;
  }

  async store(record: PageModelDto, userId?: string) {
    const r = await super.store(record, userId);
    // Add changelog?

    return r;
  }

  async update(uuid: string, record: PageModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);
    // Handle Categories
    if (Array.isArray(record.categories)) {
      const pageCategoryService = new PageCategoryService();
      // await pageCategoryService.
    }

    // Handle Tags
    if (Array.isArray(record.tags)) {
      // await
      const tagService = new TagService();
      await tagService.updateModelTags(uuid, record.tags, this.model.modelConfig);
    }

    // Handle images

    return r;
  }

  async addRelated(sourceFilter: IBaseFilter, destinationFilter: IBaseFilter) {
    try {
      await this.attachToModel(sourceFilter, destinationFilter, 'related');
    } catch (e) {
      console.log(e);
    }

    return this;
  }

  async removeRelated(sourceFilter: IBaseFilter, destinationModelName: string, destinationFilter: IBaseFilter) {
    const rel = store.getState().models['Page'].modelConfig.relationships['related'].rel;
    await this.detachOneModelFromAnother('Page', sourceFilter, destinationModelName, destinationFilter, rel);
  }
}
