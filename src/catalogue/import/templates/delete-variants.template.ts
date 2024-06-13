import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { IProcessedResult } from "~catalogue/import/templates/import-products-with-variants.template";
import { BaseImportService } from "~catalogue/import/services/base-import.service";
import { ProductVariantService } from "~catalogue/product/services/product-variant.service";
import { SharedModule } from "~shared/shared.module";
import { ProductEventNames } from "~catalogue/product/services/product.service";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ElasticSearchModule } from "~es/elastic-search.module";

@McrmImportTemplate({
  id: "DeleteVariantsTemplate",
  name: "Delete multiple Variants",
  description: "Delete variants based on an input CSV file",
  type: "variants",
})
@Injectable()
export class DeleteVariantsTemplate extends BaseImportService {
  @ImportTemplateField({
    name: "variantId",
    importFieldName: "variantId",
    required: true,
    type: "text",
    description: "The variant ID"
  })
  public variantId: string;

  async process(file: Partial<Express.Multer.File>) {
    const res = await this.processor.run(file);

    const service = new ProductVariantService();

    const query = `
    UNWIND $rows as row
    MATCH (n:ProductVariant {variantId: row.variantId})
    detach delete n;
    `;

    try {
      await service.neo.write(query, {rows: res.data});
    }
    catch (e) {
      console.log(`Error executing delete product variants query`, e);
    }

    // delete from elasticsearch
    const es = new ElasticSearchService(ElasticSearchModule.moduleRef);
    try {
      await es.bulkDelete(res.data.map(row => row['sku']));
    }
    catch (e) {
      console.log(`Error executing delete products from es`, e);
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productImportDone);

    return Promise.resolve({
      success: true,
      rowsProcessed: res.data.length
    });
  }
}
