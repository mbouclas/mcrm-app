import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { IBaseModelEs } from "~root/elastic-search/elastic-search.models";
import { ProductService } from "~catalogue/product/services/product.service";
import { ProductModel } from "~catalogue/product/models/product.model";
import { OnEvent } from "@nestjs/event-emitter";
import { IBaseFilter } from "~models/general";
import { ElasticSearchService } from "~es/elastic-search.service";

export interface IPropertyEs {
  uuid: string;
  name: string;
  slug: string;
  type: 'color'|'text';
  code?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVariantEs {
  uuid: string;
  title: string;
  slug: string;
  price: number;
  color: string;
  variantId: string;
  sku: string;
  updateAd: Date;
}

export interface IProductCategoryEs {
  uuid: string;
  title: string;
  slug: string;
}

export interface ITagEs {
  uuid: string;
  title: string;
  slug: string;
}

export interface IProductManufacturerEs {
  id: string;
  title: string;
  slug: string;
}

export interface IProductModelEs extends IBaseModelEs  {
  price: number;
  sku: string;
  properties: IPropertyEs[];
  variants: IVariantEs[];
  tags: ITagEs[];
  categories: IProductCategoryEs[];
  manufacturer: IProductManufacturerEs;
}

@Injectable()
export class SyncElasticSearchService implements OnModuleInit, OnApplicationBootstrap {
  protected esIndexName = process.env.ELASTIC_SEARCH_PROPERTY_INDEX_NAME;
  static onSyncSingleEvent = 'sync.single.complete';
  static onSyncAllEvent = 'sync.all.complete';
  static onSyncMultipleEvent = 'sync.multiple.complete';
  private readonly logger = new Logger(SyncElasticSearchService.name);

  constructor(
    private es: ElasticSearchService,
  ) {

  }

  async onApplicationBootstrap() {

  }

  async onModuleInit() {

  }

  @OnEvent(SyncElasticSearchService.onSyncSingleEvent)
  async onSyncSingle(filter: IBaseFilter) {
    try {
      await this.one(filter);
      this.logger.log(`Sync one complete : ${filter}`);
    }
    catch (e) {
      this.logger.error(`Sync one Failed : ${filter}`, e.message);
      console.log(`Sync one Failed : ${filter}`, e);
    }

  }

  @OnEvent(SyncElasticSearchService.onSyncAllEvent)
  async onSyncAll() {
    try {
      await this.all();
      this.logger.log(`Sync all complete`);
    }
    catch (e) {
      this.logger.error(`Sync all Failed`, e.message);
    }
  }

  async one(filter: IBaseFilter, syncWithEs = false) {
    const res = await (new ProductService).findOne(filter, ['*']) as ProductModel;
    console.log(this.mapGraphDataToEs([res]))
    if (syncWithEs) {
      await this.syncWithEs(this.mapGraphDataToEs([res]));
    }


    return res;
  }

  async syncOne(data: IBaseModelEs) {
    await this.syncWithEs([data]);

    return this;
  }

  /**
   * Will get all products from the Graph and put them in the ES
   * @param limit
   * @param syncWithEs
   */
  async all(limit = 40, syncWithEs = false): Promise<IProductModelEs[]> {
    let data = [];
    const productService = new ProductService();
    const firstQuery = await productService.find({limit}, ['*']);
    data = firstQuery.data;

    if (syncWithEs) {
      await this.syncWithEs(this.mapGraphDataToEs(data));
    }

    // now that we have the pagination info, we can loop through the pages
    // Start from 1 cause we've already processed the 1st page
    for (let idx = 1; firstQuery.pages-1 > idx; idx++) {
      const page = idx+1;
      this.logger.log(`processing page ${page}`);
      const res = await productService.find({page, limit}, ['*']);

      this.logger.log(`done with page ${page} - ${res.data.length}, we now have ${data.length} items`);

      if (syncWithEs) {
        await this.syncWithEs(this.mapGraphDataToEs(data));
      }

      data = data.concat(res.data);
    }

    return data;
  }

  async syncWithEs(data: IBaseModelEs[]) {
    if (!await this.es.indexExists(this.esIndexName)) {
      console.log('Creating index');
    }


    const body = data.flatMap(doc => [{ index: { _index: this.esIndexName, _id: doc.id } }, doc]);
    const bulkResponse = await this.es.client.bulk({ refresh: true, body });
  }

  private mapGraphDataToEs(data: ProductModel[]): IProductModelEs[] {
    return data.map(item => {
      return item as unknown as IProductModelEs;
    });
  }
}
