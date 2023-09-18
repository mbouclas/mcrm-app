import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ElasticSearchService } from '~es/elastic-search.service';
import { OnEvent } from '@nestjs/event-emitter';
import { IProductModelEs } from '~catalogue/export/sync-elastic-search.service';
import { IPagination } from '~models/general';
import { ProductService } from '~catalogue/product/services/product.service';
import { ProductConverterService } from '~catalogue/sync/product-converter.service';
import { SyncModule } from '~catalogue/sync/sync.module';
import { ProductModel } from '~catalogue/product/models/product.model';
import { PropertyService } from '~catalogue/property/services/property.service';
import { ElasticSearchModule } from "~es/elastic-search.module";

@Injectable()
export class SyncEsService {
  protected esIndexName = process.env.ELASTIC_SEARCH_PRODUCT_INDEX_NAME;
  static onSyncSingleEvent = 'sync.single.complete';
  static onSyncAllEvent = 'sync.all.complete';
  static onSyncMultipleEvent = 'sync.multiple.complete';
  private readonly logger = new Logger(SyncEsService.name);
  protected rels = ['propertyValues', 'properties', 'productCategory', 'manufacturer', 'variants', 'images', 'thumb', 'tags', 'related'];

  constructor(private es: ElasticSearchService) {}

  async onApplicationBootstrap() {
    // SyncModule.event.emit(SyncEsService.onSyncAllEvent, {limit: 40, saveOnEs: true})
    // SyncModule.event.emit(SyncEsService.onSyncSingleEvent, '75342920-a45c-403a-a320-8c748dfc1b26')
    setTimeout(async () =>{
      // const s = new SyncEsService(new ElasticSearchService(ElasticSearchModule.moduleRef));
      // await s.one('75342920-a45c-403a-a320-8c748dfc1b26', true);
      // await s.one('58e6277c-9c85-49e3-a391-feae7b301ade', true);
    }, 1000)

  }

  @OnEvent(SyncEsService.onSyncSingleEvent)
  async onSyncSingle(id: string) {
    try {
      await this.one(id, true);
      this.logger.log(`Sync one complete : ${id}`);
    } catch (e) {
      this.logger.error(`Sync one Failed : ${id}`, e.message);
    }
  }

  @OnEvent(SyncEsService.onSyncAllEvent)
  async onSyncAll(options: { limit: number; saveOnEs: boolean }) {
    try {
      await this.all(options.limit, options.saveOnEs);
      this.logger.log(`Sync all complete`);
    } catch (e) {
      this.logger.error(`Sync all Failed`, e.message);
    }
  }

  @OnEvent(SyncEsService.onSyncMultipleEvent)
  async onSyncMultiple(id: number[] | string[]) {}

  async syncOne(data: IProductModelEs) {
    await this.syncWithEs([data]);

    return this;
  }

  async one(uuid: string, syncWithEs = false) {
    const service = new ProductService();
    const allProperties = await new PropertyService().find({ limit: 1000 });
    const product = await service.findOne({ uuid }, this.rels);
    const item = await new ProductConverterService(allProperties).convert(product);
    //get similar/related products
    //const similar = await (new SimilarItemsService(this.es)).search(item.id, {})

    if (syncWithEs) {
      await this.syncOne(item);
    }

    return item;
  }

  async all(limit = 40, syncWithEs = false): Promise<IProductModelEs[]> {
    let data = [];
    const service = new ProductService();
    const allProperties = await new PropertyService().find({ limit: 1000 });

    const converter = new ProductConverterService(allProperties);

    const firstQuery = await service.find({ limit }, this.rels);
    for (let idx = 0; idx < firstQuery.data.length; idx++) {
      data.push(await converter.convert(firstQuery.data[idx] as ProductModel));
    }

    if (syncWithEs) {
      await this.syncWithEs(data);
    }

    // now that we have the pagination info, we can loop through the pages
    // Start from 1 cause we've already processed the 1st page
    for (let idx = 1; firstQuery.pages > idx; idx++) {
      const page = idx + 1;
      console.log(`processing page ${page}`);
      const res = await service.find({ limit, page }, this.rels);
      console.log(`done with page ${page} - ${res.pages}, we now have ${data.length} items`);
      for (let idx = 0; idx < res.data.length; idx++) {
        res.data[idx] = (await converter.convert(res.data[idx] as ProductModel)) as unknown as any;
      }

      if (syncWithEs) {
        await this.syncWithEs(res.data as unknown as IProductModelEs[]);
      }
      data = data.concat(res.data);
    }

    return data;
  }

  async syncWithEs(data: IProductModelEs[]) {
    if (!(await this.es.indexExists(this.esIndexName))) {
      console.log('Creating index');
      /*            try {
                      return await this.es.client.indices.create({
                          index,
                          body: readFileSync(resolve(process.cwd(), 'deployment', 'site-config.es-index.json'))
                      });
                  }
                  catch (e) {
                      console.log(`Cannot create index ${index}`, e);
                  }*/
    }

    const operations = data.flatMap((doc) => [
      { index: { _index: this.esIndexName, _id: doc.id || doc['uuid'] } },
      doc,
    ]);

    const bulkResponse = await this.es.client.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      ElasticSearchService.outputBulkResponseErrors(bulkResponse.errors, operations, bulkResponse.items);
    }

    console.log(`Synced ${data.length} records with ES`);
    return true;
  }
}
