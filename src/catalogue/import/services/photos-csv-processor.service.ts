import { BaseProcessorService, IBaseTransformerSchema } from "~catalogue/import/services/base-processor";
import { IInvalidField, IProcessorResult, ITransformerResult } from "~catalogue/import/services/import.service";
import { createReadStream, existsSync } from "fs";
import slug from "slug";
const csv = require('csv-parser');
export interface IPhotosImportSchema extends IBaseTransformerSchema {
  variantId?: string;
  productId?: string;
  image: string;
  id: string;
  sku: string;
}
export interface IPhotosTransformerResult extends ITransformerResult<IPhotosImportSchema> {
}
export class PhotosCsvProcessorService extends BaseProcessorService {
  results = [];
  invalidRows = [];

  async run(file: Express.Multer.File): Promise<IProcessorResult> {
    await super.run(file);
    if (!existsSync(file.path)) {
      throw new Error(`File ${file.path} does not exist`);
    }

    return new Promise((resolve, reject) => {
      let idx = 0;
      createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => {
          const processedRow = this.transformRow(data, idx === 0);

          if (processedRow.isInvalid && this.invalidRows.findIndex(r => r.id === processedRow.data.id) === -1) {
            this.invalidRows.push({row: idx, fields: processedRow.invalidFields, id: processedRow.data.id});
            return;
          }

          this.results.push(processedRow.data);
          idx++;
        })
        .on('error', (e) => { console.log(`Photo CSV Processor Error processing file ${file.path}`); reject(e); })
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

  protected transformRow(rowData: any, debug: boolean = false): ITransformerResult<IPhotosImportSchema> {
    const data: IPhotosImportSchema = {} as IPhotosImportSchema;

    let isInvalid = false
    const invalidFields = [];
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

        if (field.type === 'number') {
          data[field.name] = parseInt(rowData[key]);

          return;
        }

        if (field.type === 'float') {
          data[field.name] = parseFloat(rowData[key]);
          return;
        }

        if (field.isSlugFor) {
          data[field.isSlugFor] = slug(rowData[key], {trim: true, lower: true});
          return;
        }

        if (field.name === 'variantId') {
          const parts = rowData[key].split('.');
          data['sku'] = parts[0];
        }

        data[field.name] = rowData[key];
      });


    return {
      data,
      isInvalid,
      invalidFields,
    };
  }

}
