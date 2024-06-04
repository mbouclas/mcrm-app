import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable, Optional } from "@nestjs/common";
import {
  BaseImportService,
  IBaseImportServiceArgs,
  IBaseImportServiceSettings
} from "~catalogue/import/services/base-import.service";
import { z } from "zod";
import { PropertiesService } from "~catalogue/import/services/properties.service";
import { PropertyValueModel } from "~catalogue/property/models/property-value.model";
const slug = require('slug');

export const settings: Partial<IBaseImportServiceSettings> = {
  propertySlug: 'color',
  matchKey: 'slug',
};

export const settingsSchema = z.object({
  propertySlug: z.string().describe(`json:{"label": "Slug for the property", "placeholder": "Slug for the property", "hint": "The slug of the property fields", "default": "color"}`),
  matchKey: z.string().describe(`json:{"label": "Match Key", "placeholder": "Match Key", "hint": "The key to match values against", "default": "code"}`),

});

@McrmImportTemplate({
  id: "ImportPropertyValuesTemplate",
  name: 'Import property values',
  description: 'Import property values from CSV file',
  type: 'propertyValues'
})
@Injectable()
export class ImportPropertyValuesTemplate extends BaseImportService {
  static settingsSchema = settingsSchema;
  static settings: Partial<IBaseImportServiceSettings> = settings;

  @ImportTemplateField({name: 'name', importFieldName: 'name', required: true, type: 'text', description: `e.g. Red`})
  public name: string;

  @ImportTemplateField({name: 'code', importFieldName: 'code', required: false, type: 'text', description: `e.g. 0012`})
  public code: string;

  @ImportTemplateField({name: 'image', importFieldName: 'image', required: false, type: 'text'})
  public image: string;

  @ImportTemplateField({name: 'color', importFieldName: 'color', required: false, type: 'text', description: `e.g. #ff0000`})
  public color: string;

  @ImportTemplateField({name: 'rgb', importFieldName: 'rgb', required: false, type: 'text', description: `e.g. 255,0,0`})
  public rgb: string;

  constructor(@Optional() args?: Partial<IBaseImportServiceArgs>) {
    super(args);
  }

  async process(file: Partial<Express.Multer.File>) {
    const res = await this.processor.run(file);
    const service = new PropertiesService();

    res.data.forEach((row: PropertyValueModel) => {
      row.slug = slug(row.name, {lower: true});
    });


    try {
      // It should be using the this.settings['propertySlug'] but it's not working.
      await service.importPropertyValuesFromCsv({ slug: this['propertySlug'] }, res.data as PropertyValueModel[], this['matchKey']);
    }
    catch (e) {
      console.log(`Error importing values`, e);
      return {
        success: false,
        rowsProcessed: res.data.length,
        error: e.message,
      };

    }

    // check if the color already exists
    return {
      success: true,
      rowsProcessed: res.data.length,
    };
  }
}
