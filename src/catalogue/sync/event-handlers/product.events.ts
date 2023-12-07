import { OnEvent } from "@nestjs/event-emitter";
import { ProductEventNames } from "~catalogue/product/services/product.service";
import { Injectable } from "@nestjs/common";
import { ProductModel } from "~catalogue/product/models/product.model";
import { SyncEsService } from "~catalogue/sync/sync-es.service";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ElasticSearchModule } from "~es/elastic-search.module";

/**
 * Sync product with ES based on product events
 */
@Injectable()
export class ProductEvents {
  @OnEvent(ProductEventNames.productCreated)
  async onProductCreated(item: ProductModel) {
    const s = new SyncEsService(new ElasticSearchService(ElasticSearchModule.moduleRef));
    try {
      await s.one(item.uuid, true);
    }
    catch (e) {
      console.log(`PRODUCT_UPDATE EVENT: Error syncing product ${item.slug} with ES`, e.message);
    }
  }

  @OnEvent(ProductEventNames.productUpdated)
  async onProductUpdated(item: ProductModel) {

    const s = new SyncEsService(new ElasticSearchService(ElasticSearchModule.moduleRef));
    try {
      await s.one(item.uuid, true);
    }
    catch (e) {
      console.log(`PRODUCT_UPDATE EVENT: Error syncing product ${item.slug} with ES`, e);
    }
  }

  @OnEvent(ProductEventNames.bulkUpdate)
  async onBulkUpdate(ids: string[]) {
    const s = new SyncEsService(new ElasticSearchService(ElasticSearchModule.moduleRef));
    for (const id of ids) {
      try {
        await s.one(id, true);
      }
      catch (e) {
        console.log(`PRODUCT_UPDATE EVENT: Error syncing product ${id} with ES`, e.message);
      }
    }
  }

  @OnEvent(ProductEventNames.productDeleted)
  async onProductDeleted(uuid: string) {
    const s = new ElasticSearchService(ElasticSearchModule.moduleRef);
    try {
      await s.deleteRecord(uuid);
    }
    catch (e) {
      console.log(`PRODUCT_DELETE EVENT: Error deleting product ${uuid} from ES`, e.message);
    }
  }
}
