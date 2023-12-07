import { BasePatch } from "~root/update/base.patch";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { ElasticSearchService } from "~es/elastic-search.service";
import { getStoreProperty } from "~root/state";

@McmsDi({
  id: 'UpdateEsMappingsForRelatedUpdate',
  type: 'patch',
  description: 'Updates the ES mappings for related products'
})
@Injectable()
export class UpdateEsMappingsForRelatedUpdate extends BasePatch {
  async run() {
    const query = {
      "properties": {
        "related": {
          "type": "nested",
          "dynamic": true,
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            },
            "price": {
              "type": "integer"
            },
            "sku": {
              "type": "text"
            },
            "thumb": {
              "type": "object",
              "dynamic": true
            }
          }
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
      console.log(`ERROR UPDATING ES MAPPINGS FOR Related:`, e);
    }

    console.log('DONE UPDATING ES MAPPINGS FOR Related');
  }

}
