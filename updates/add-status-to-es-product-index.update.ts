import { BasePatch } from "~root/update/base.patch";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { ElasticSearchService } from "~es/elastic-search.service";
import { getStoreProperty } from "~root/state";

@McmsDi({
  id: 'AddStatusToEsProductIndexUpdate',
  type: 'patch',
  description: 'Updates the ES to add a status field to the product index'
})
@Injectable()
export class AddStatusToEsProductIndexUpdate extends BasePatch {
  async run() {
    const query =     {
      "properties": {
        "active": {
          "type": "boolean"
        }
      }
    };

    const es = ElasticSearchService.newInstance();
    const index = getStoreProperty("configs.catalogue.elasticSearch.index")
    try {
      await es.client.indices.putMapping({
        ...{ index },
        ...query
      })
    } catch (e) {
      console.log(`ERROR UPDATING ES MAPPINGS FOR ACTIVE FIELD:`, e);
    }

    console.log('DONE UPDATING ES MAPPINGS FOR ACTIVE FIELD');
  }
}
