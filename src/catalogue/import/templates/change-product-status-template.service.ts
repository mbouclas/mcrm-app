import { BaseImportService } from "~catalogue/import/services/base-import.service";
import { McrmImportTemplate } from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { ProductService } from "~catalogue/product/services/product.service";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";


@McrmImportTemplate({
  id: 'ChangeProductStatusTemplate',
  name: 'Change Products Status',
  description: 'Change the status of products based on an input CSV file',
  type: 'products'
})
@Injectable()
export class ChangeProductStatusTemplateService extends BaseImportService {
  fieldMap: IImportProcessorFieldMap[] = [
    {
      name: "sku",
      importFieldName: "REFERENCE",
      rename: false,
      required: true,
      type: "text"
    },
    {
      name: "variantId",
      importFieldName: "variantID",
      rename: false,
      required: true,
      type: "variantId"
    },
    {
      name: "active",
      importFieldName: "active",
      rename: false,
      required: true,
      type: "boolean"
    }
  ];

  constructor() {
    super();
    this.processor.setFieldMap(this.fieldMap);
  }

  async process(file: Partial<Express.Multer.File>) {
    // run the processor against the database
    const res = await this.processor.run(file);

    const service = new ProductService();
    const query = `
    UNWIND $rows as row
    MATCH (n:Product {sku: row.sku})
    SET n.active = row.active, n.updatedAt = datetime()
    RETURN n;
    `;

    try {
      await service.neo.write(query, {rows: res.data});
    }
    catch (e) {
      console.log(`Error executing product status update query`, e);
    }

    return {
      success: true,
      rowsProcessed: res.data.length,
    };
  }
}
