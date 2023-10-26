import { BaseImportService } from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { ProductService } from "~catalogue/product/services/product.service";

@McrmImportTemplate({
  id: 'AddImagesToVariantsTemplate',
  name: 'Add Images to Variants',
  description: 'Adds images to variants based on an input CSV file',
  type: 'products'
})
export class AddImagesToVariantsTemplateService extends BaseImportService {
  @ImportTemplateField({name: 'sku', importFieldName: 'REFERENCE', required: true, type: 'text'})
  public sku: string;

  @ImportTemplateField({name: 'variantId', importFieldName: 'variantID', required: true, type: 'variantId', rename: false})
  public variantId: string;

  @ImportTemplateField({name: 'image', importFieldName: 'image', required: true, type: 'text'})
  public image: string;



  async process(file: Partial<Express.Multer.File>) {
    // run the processor against the database
    const res = await this.processor.run(file);

    const service = new ProductService();
    const query = `
    UNWIND $rows as row
    MATCH (n:ProductVariant {variantId: row.variantId})
    SET n.thumb = row.image, n.updatedAt = datetime()
    RETURN n;
    `;

    try {
      await service.neo.write(query, {rows: res.data});
    }
    catch (e) {
      console.log(`Error executing product variant image update query`, e);
    }

    return {
      success: true,
      rowsProcessed: res.data.length,
    };
  }
}
