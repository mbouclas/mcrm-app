import {
  BaseImportService,
  IBaseImportServiceArgs,
  IBaseImportServiceSettings
} from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable, Optional } from "@nestjs/common";
import { PropertiesService } from "~catalogue/import/services/properties.service";
import { z } from "zod";
import { PropertyValueModel } from "~catalogue/property/models/property-value.model";
const slug = require('slug');

export const settings: Partial<IBaseImportServiceSettings> = {
  propertySlug: 'color',
  matchKey: 'code',
};

export const settingsSchema = z.object({
  propertySlug: z.string().describe(`json:{"label": "Slug for the property", "placeholder": "Slug for the property", "hint": "The slug of the property fields", "default": "color"}`),
  matchKey: z.string().describe(`json:{"label": "Match Key", "placeholder": "Match Key", "hint": "The key to match values against", "default": "code"}`),

});

@McrmImportTemplate({
  id: 'ImportColorsTemplate',
  name: 'Import new colors',
  description: 'Import new colors from CSV file',
  type: 'propertyValues'
})
@Injectable()
export class ImportColorsTemplate extends BaseImportService {

  static settingsSchema = settingsSchema;
  static settings: Partial<IBaseImportServiceSettings> = settings;

  @ImportTemplateField({name: 'name', importFieldName: 'name', required: true, type: 'text', description: `e.g. Red`})
  public name: string;

  @ImportTemplateField({name: 'code', importFieldName: 'code', required: true, type: 'text', description: `e.g. 0012`})
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
      console.log(`Error importing colors`, e);
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
