import { BaseImportService } from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { z } from "zod";
import { TagService } from "~tag/services/tag.service";

const settingsSchema = z.object({
  // allowFileUploads: z.boolean().describe('json:{"label": "Allow file uploads", "placeholder": "Allow file uploads", "hint": "Allow file uploads"}'),
});


@McrmImportTemplate({
  id: 'UpdateProductsTemplate',
  name: 'Update Products',
  description: 'Bulk update products based on an input CSV file',
  type: 'products'
})
@Injectable()
export class UpdateProductsTemplate extends BaseImportService {
  static settingsSchema = settingsSchema;

  @ImportTemplateField({name: 'sku', importFieldName: 'sku', required: true, type: 'sku', description: 'The SKU of the product to update'})
  public sku: string;

  @ImportTemplateField({name: 'active', importFieldName: 'active', required: false, type: 'boolean', description: 'The new active status of the product. true = active, false = inactive'})
  public active: boolean;

  @ImportTemplateField({name: 'tags', importFieldName: 'tags', required: false, type: 'tag', description: `A semi-colon separated list of tags to apply to the product.<br> Caution: if the tag does not exist, it will be created`,
    settings: {separator: ';'},
    fieldSettingsConfig: [
      {
        varName: 'separator',
        type: 'text',
        label: 'Tag separator',
        placeholder: 'Tag separator',
        hint: 'The character used to separate tags in the CSV file',
        default: ';'
      },
      {
        varName: 'removeExisting',
        type: 'boolean',
        label: 'Remove existing tags',
        placeholder: 'Remove existing tags',
        hint: 'If true, existing tags will be removed before applying the new tags',
        default: false
      }
    ]})
  tags: string;

  async process(file: Partial<Express.Multer.File>) {
    const res = await this.analyze(file);
    const products = res.data;

    try {

    }
    catch (e) {

    }

    try {
      await this.linkProductsToTags(products);
    } catch (error) {
      console.error('Error in linkProductsToTags:', error);
    }


    return Promise.resolve({
      success: true,
      rowsProcessed: 0,
    });
  }

  private async linkProductsToTags(products: any[]) {
    const service = new TagService();
    for (let idx = 0; products.length > idx; idx++) {
      await service.bulkAddTagsToModel('Product', {sku: products[idx].sku}, products[idx].tags);
    }

    console.log('Products linked to tags')
  }
}
