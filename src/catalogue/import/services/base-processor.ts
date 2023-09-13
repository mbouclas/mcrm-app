import { Injectable } from "@nestjs/common";
import { createReadStream, existsSync } from "fs";
import { IBaseProcessorResult, IBaseTransformerResult } from "~catalogue/import/services/base-import.service";
const slug = require('slug');
const csv = require('csv-parser');

export interface IImportProcessorFieldMap {
  name: string;
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
}

export interface IBaseTransformerSchema {
  variantId?: string;
  active: boolean;
  sku: string;
}

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

    Object.keys(rowData)
      .filter(key => {
        return this.fieldMap.findIndex(f => f.importFieldName === key.trim()) !== -1
      })
      .forEach(key => {
        const field = this.fieldMap.find(f => f.importFieldName === key.trim());

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

      });

    return {
      data,
      isInvalid,
      invalidFields,
    };
  }

}
