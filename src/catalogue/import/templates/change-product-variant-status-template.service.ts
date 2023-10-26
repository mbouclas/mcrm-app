import { Injectable } from "@nestjs/common";
import { BaseImportService } from "~catalogue/import/services/base-import.service";
import { ProductService } from "~catalogue/product/services/product.service";
import {  IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { ErrorDuringImportException } from "~catalogue/import/exceptions/error-during-import.exception";
import { Job } from "bullmq";


@McrmImportTemplate({
  id: 'ChangeProductVariantStatusTemplate',
  name: 'Change Product Variants Status',
  description: 'Change the status of product variants based on an input CSV file',
  type: 'products'
})
@Injectable()
export class ChangeProductVariantStatusTemplate extends BaseImportService {
  @ImportTemplateField({name: 'sku', importFieldName: 'REFERENCE', required: true, type: 'text', rename: false})
  public sku: string;

  @ImportTemplateField({name: 'variantId', importFieldName: 'variantID', required: true, type: 'variantId', rename: false})
  public variantId: string;

  @ImportTemplateField({name: 'active', importFieldName: 'active', required: true, type: 'boolean', rename: false})
  public active: boolean;


  jobEventName = 'changeProductVariantStatusJob';
  constructor() {
    super();
    this.processor.setFieldMap(this.fieldMap);
  }

  /**
   * We want to set the status of the products based on the file
   * Best idea is to use the UNWIND command and set the status
   * @param file
   */
  async process(file: Partial<Express.Multer.File>) {
    // run the processor against the database
    const res = await this.analyze(file);

    const service = new ProductService();
    const query = `
    UNWIND $rows as row
    MATCH (n:ProductVariant {variantId: row.variantId})
    SET n.active = row.active, n.updatedAt = datetime()
    RETURN n;
    `;

    try {
      await service.neo.write(query, {rows: res.data});
    }
    catch (e) {
      console.log(`Error executing product variant status update query`, e);
      throw new ErrorDuringImportException(`ERROR_DURING_IMPORT`, `1700.1`, {message: e.message });
    }

    return {
      success: true,
      rowsProcessed: res.data.length,
    };
  }


}



