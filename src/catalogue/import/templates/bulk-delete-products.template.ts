import { BaseImportService } from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { ProductEventNames, ProductService } from "~catalogue/product/services/product.service";
import { SharedModule } from "~shared/shared.module";


@McrmImportTemplate({
  id: 'BulkDeleteProductsTemplate',
  name: 'Bulk Delete Products',
  description: 'Bulk delete products based on an input CSV file',
  type: 'products'
})
@Injectable()
export class BulkDeleteProductsTemplate extends BaseImportService {
  @ImportTemplateField({name: 'sku', importFieldName: 'sku', required: true, type: 'sku', description: 'The SKU of the product to update'})
  public sku: string;

  async process(file: Partial<Express.Multer.File>) {
    const res = await this.analyze(file);
    const products = res.data;

    const query = `
    UNWIND $rows as row
    MATCH (n:Product {sku: row.sku}) WHERE n IS NOT NULL
    MATCH (v:ProductVariant {sku: row.sku}) WHERE v IS NOT NULL
    DETACH DELETE n, v
    `;

    try {
      await (new ProductService()).neo.write(query, { rows: products });
    } catch (e) {
      console.log(`Error in BulkDeleteProductsTemplate`, e);
      return {
        success: false,
        rowsProcessed: 0,
      };
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productImportDone);
    return Promise.resolve({
      success: true,
      rowsProcessed: res.validRows
    });
  }
}
