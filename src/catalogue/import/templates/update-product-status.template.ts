import { BaseImportService } from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { ProductService } from "~catalogue/product/services/product.service";

@McrmImportTemplate({
  id: 'UpdateProductStatusTemplate',
  name: 'Update Product Status',
  description: 'Bulk update product status based on an input CSV file',
  type: 'products'
})
@Injectable()
export class UpdateProductStatusTemplate extends BaseImportService {
  @ImportTemplateField({name: 'sku', importFieldName: 'sku', required: true, type: 'sku', description: 'The SKU of the product to update'})
  public sku: string;

  @ImportTemplateField({name: 'active', importFieldName: 'active', required: false, type: 'boolean', description: 'The new active status of the product. true = active, false = inactive'})
  public active: boolean;

  async process(file: Partial<Express.Multer.File>) {
    const res = await this.analyze(file);
    const products = res.data;

    const query = `
    UNWIND $rows as row
    MATCH (n:Product {sku: row.sku}) WHERE n IS NOT NULL
    SET n.active = row.active
    return *;
    `;

    try {
      await new ProductService().neo.write(query, {rows: products});
    }
    catch (e) {
      console.log(`Error in UpdateProductStatusTemplate`,e);
      return Promise.resolve({
        success: false,
        rowsProcessed: 0,
      });
    }

    return Promise.resolve({
      success: true,
      rowsProcessed: res.data.length,
    });
  }
}
