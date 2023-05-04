import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from "@nestjs/axios";
import { ElasticSearchService } from "~es/elastic-search.service";
import { OnEvent } from "@nestjs/event-emitter";
import { IProductModelEs } from "~catalogue/export/sync-elastic-search.service";
import { IPagination } from "~models/general";
import { ProductService } from "~catalogue/product/services/product.service";

@Injectable()
export class SyncEsService {
  protected esIndexName = process.env.ELASTIC_SEARCH_PRODUCT_INDEX_NAME;
  static onSyncSingleEvent = 'sync.single.complete';
  static onSyncAllEvent = 'sync.all.complete';
  static onSyncMultipleEvent = 'sync.multiple.complete';
  private readonly logger = new Logger(SyncEsService.name);

  constructor(
    private readonly httpService: HttpService,
    private es: ElasticSearchService,
  ) {
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    // SyncModule.event.emit(SyncService.onSyncAllEvent, {limit: 40, saveOnEs: true})
  }

  @OnEvent(SyncEsService.onSyncSingleEvent)
  async onSyncSingle(id: string) {
    try {
      await this.one(id, true);
      this.logger.log(`Sync one complete : ${id}`);
    }
    catch (e) {
      this.logger.error(`Sync one Failed : ${id}`, e.message);
    }
  }

  @OnEvent(SyncEsService.onSyncAllEvent)
  async onSyncAll(options: {limit: number, saveOnEs: boolean}) {
    try {
      await this.all(options.limit, options.saveOnEs);
      this.logger.log(`Sync all complete`);
    }
    catch (e) {
      this.logger.error(`Sync all Failed`, e.message);
    }
  }

  @OnEvent(SyncEsService.onSyncMultipleEvent)
  async onSyncMultiple(id: number[]|string[]) {

  }

  async syncOne(data: IProductModelEs) {
    await this.syncWithEs([data]);

    return this;
  }

  async one(uuid: string, syncWithEs = false) {
    const service = new ProductService();
    const product = await service.findOne({uuid});
  }

  async all(limit = 40, syncWithEs = false): Promise<IProductModelEs[]> {
    return [];
  }

  async find(page = 1, limit = 10): Promise<IPagination<IProductModelEs>> {
    return {
      data: [],
      total: 0,
      page,
      limit,
    }
  }

  async syncWithEs(data: IProductModelEs[]) {
    if (!await this.es.indexExists(this.esIndexName)) {
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

    const operations = data.flatMap(doc => [{ index: { _index: this.esIndexName, _id: doc.id } }, doc]);
    const bulkResponse = await this.es.client.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      ElasticSearchService.outputBulkResponseErrors(bulkResponse.errors, operations, bulkResponse.items);
    }

    console.log(`Synced ${data.length} records with ES`)
    return true;
  }
}
