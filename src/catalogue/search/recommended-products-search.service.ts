import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IGenericObject } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import { ImageService } from "~image/image.service";
import { OrderService } from "~eshop/order/services/order.service";

@Injectable()
export class RecommendedProductsSearchService extends BaseNeoService {
  onApplicationBootstrap() {
    setTimeout(async () => {
/*      const s = new RecommendedProductsSearchService();
      const res = await s.simpleRecommendation({slug: 'poppy'});
      console.log(res);*/

/*      const s = new OrderService();
      const orders = await s.find();
      for (const o of orders.data) {
        await s.attachOrderProductsToUser(o['uuid']);
      }*/


/*
      const s = new RecommendedProductsSearchService();

      console.log(await s.recommendBestSellers())
*/

    }, 1000);
  }

  async recommendBestSellers(limit = 5) {
    const query = `
      MATCH (u:User)-[r:HAS_BOUGHT]->(p:Product)
      return p.uuid as productId, count(r) as numberOfPurchases ORDER BY numberOfPurchases DESC LIMIT ${limit};
    `;

    return await this.neo.readWithCleanUp(query);

  }

  async recommendProductsToUserBasedOnPastOrders(userId: string, limit = 5) {

  }

  async simpleRecommendation(filter: IGenericObject, limit = 5, priceRange = 2) {
    const {key, value} = extractSingleFilterFromObject(filter);

    const query = `
    MATCH (p:Product {${key}: '${value}'})-[:HAS_PROPERTY_VALUE]->(val:PropertyValue)
    MATCH (p)-[:HAS_CATEGORY]->(cat:ProductCategory)
    WITH collect(val) AS values, p,cat
    MATCH (other:Product)-[:HAS_PROPERTY_VALUE]->(val2:PropertyValue)
      WHERE other <> p AND other.active = true
    
      AND any(v IN values WHERE (val2.uuid = v.uuid))
      AND (other)-[:HAS_CATEGORY]->(:ProductCategory {uuid: cat.uuid})
      AND abs(p.price - other.price) < ${priceRange}
    return other as product, count(other) as score
    
      limit ${limit};
    `;

    try {
      const res = await this.neo.readWithCleanUp(query);
      const recommendations = [];
      for (const r of res) {
        const p = r.product;
        const images = await (new ImageService).getItemImages('Product', p['uuid']);
        p['thumb'] = images.find((img) => img.type === 'main') || null;
        recommendations.push(p);
      }

      return recommendations;
    }
    catch (e) {
      console.error(`Error in simpleRecommendation`, e.message);
      return [];
    }
  }
}
