import { Injectable } from "@nestjs/common";
import { createReadStream, existsSync } from "fs";
import { IBaseProcessorResult, IBaseTransformerResult } from "~catalogue/import/services/base-import.service";
import { IGenericObject } from "~models/general";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
const slug = require('slug');
const csv = require('csv-parser');

export interface IImportProcessorFieldMap {
  name: string;
  description?: string;
  importFieldName: string;
  rename?: boolean;
  required?: boolean;
  type?: 'text'|'number'|'float'|'boolean'|'category'|'property'|'image'|'variantId'|'productId'|'price'|'tag';
  relationships?: string[];//graph rels. If present they must be the ones present on the model
  validations?: Function[],// list of validations to run, each entry is a function
  isSlugFor?: string;
  matchSourceValue?: string;
  matchTargetValue?: string;
  slugifyValue?: boolean;
  priceOnRequestFlag?: string;
  settings?: IGenericObject;
  fieldSettingsConfig?: IDynamicFieldConfigBlueprint[];
}

export interface IBaseTransformerSchema {
  variantId?: string;
  active: boolean;
  sku: string;
}

/**
 * BaseProcessorService is a class that provides a base functionality for processing data from a file.
 * It includes methods for setting and getting field mappings, as well as running the processing logic.
 */
@Injectable()
export class BaseProcessorService {
  protected fieldMap: IImportProcessorFieldMap[] = [];
  results = [];
  invalidRows = [];

  public setFieldMap(fields: IImportProcessorFieldMap[]) {
    this.fieldMap = fields;
    return this;
  }

  public getFieldMap() {
    return this.fieldMap;
  }

  async run(file: Partial<Express.Multer.File>): Promise<IBaseProcessorResult> {
    if (!existsSync(file.path)) {
      throw new Error(`File ${file.path} does not exist`);
    }

    return new Promise(async (resolve, reject) => {
      let idx = 0;

      createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => {
          const processedRow = this.transformRow(data, idx === 0);

          if (processedRow.isInvalid) {
            this.invalidRows.push({id: idx, row: data, fields: processedRow.invalidFields});
            idx++;
            return;
          }

          this.results.push(processedRow.data);
          idx++;
        })
        .on('error', (e) => { console.log(`CSV ChangeProductStatusTemplateProcessor Error processing file ${file.path}`); reject(e); })
        .on('end', () => {
          resolve({
            data: this.results,
            invalidRows: this.invalidRows,
            isInvalid: this.invalidRows.length > 0,
            validRows: this.results.length,
          })
        });
    });
  }

  /**
   * This is the part to override
   * @param rowData
   * @param debug
   * @protected
   */
  protected transformRow(rowData: any, debug = false): IBaseTransformerResult<IBaseTransformerSchema> {
    let isInvalid = false
    const invalidFields = [];
    const data: IBaseTransformerSchema = {} as IBaseTransformerSchema;

    this.fieldMap.forEach(field => {
      const key = field.importFieldName;

      if (field.required && !rowData[key]) {
        isInvalid = true;
        invalidFields.push({key, value: rowData});
        return;
      }

      data[field.name] = rowData[key];

      if (field.type === 'boolean') {
        data[field.name] = rowData[key].toLowerCase() === 'true';
      }

      if (field.type === 'image') {
        data['image'] = rowData[key];
      }

      if (field.type === 'number') {
        data[field.name] = parseInt(rowData[key]);
      }

      if (field.type === 'float') {
        data[field.name] = parseFloat(rowData[key]);
      }

      if (field.type === 'price') {
        // Some products may have a special flag that asks the customer to contact for info "priceOnRequestFlag"
        // ignoring the price field will make sure that this product won't show on the price range results
        data[field.name] = (typeof rowData[key] === 'string' && field.priceOnRequestFlag.trim() === rowData[key]) ? null : parseFloat(rowData[key]);
      }

      if (field.type === 'variantId') {
        data['variantId'] = rowData[key];
        data['variantSlug'] = slug(rowData[key], {trim: true, lower: true});
      }

      if (field.type === 'tag') {
        const separator = field.settings?.separator || ';';
        data['tag'] = rowData[key].split(separator).map(t => t.trim());
      }

      if (field.isSlugFor) {
        data[field.isSlugFor] = slug(rowData[key], {trim: true, lower: true});
      }

    });


/*    Object.keys(rowData)
      .forEach(key => {
        const field = this.fieldMap.find(f => f.importFieldName === key.trim());
        if (!field) {
          isInvalid = true;
          invalidFields.push({key, value: rowData[key]});
          return;
        }
       // reject unknown fields

/!*        if (!field[key]) {
          return;
        }*!/

        if (field.required && !rowData[key]) {
          isInvalid = true;
          invalidFields.push({key, value: rowData[key]});
          return;
        }

        data[field.name] = rowData[key];

        if (field.type === 'boolean') {
          data[field.name] = rowData[key].toLowerCase() === 'true';
        }

        if (field.type === 'image') {
          data['image'] = rowData[key];
        }

        if (field.type === 'number') {
          data[field.name] = parseInt(rowData[key]);
        }

        if (field.type === 'float') {
          data[field.name] = parseFloat(rowData[key]);
        }

        if (field.type === 'price') {
          // Some products may have a special flag that asks the customer to contact for info "priceOnRequestFlag"
          // ignoring the price field will make sure that this product won't show on the price range results
          data[field.name] = (typeof rowData[key] === 'string' && field.priceOnRequestFlag.trim() === rowData[key]) ? null : parseFloat(rowData[key]);
        }

        if (field.type === 'variantId') {
          data['variantId'] = rowData[key];
          data['variantSlug'] = slug(rowData[key], {trim: true, lower: true});
        }

        if (field.isSlugFor) {
          data[field.isSlugFor] = slug(rowData[key], {trim: true, lower: true});
        }

      });*/

    return {
      data,
      isInvalid,
      invalidFields,
    };
  }

}
