import { Injectable } from '@nestjs/common';
import { BaseProcessorService } from "~catalogue/import/services/base-processor";
import { createReadStream, existsSync } from "fs";
import {
  IImportSchema,
  ImportService,
  IProcessorResult,
  ITransformerResult
} from "~catalogue/import/services/import.service";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
const slug = require('slug');
const csv = require('csv-parser');

@Injectable()
export class CsvProcessorService extends BaseProcessorService {
  results = [];
  invalidRows = [];
  public static allCategories: ProductCategoryModel[] = [];


  async run(file: Express.Multer.File): Promise<IProcessorResult> {
    if (!existsSync(file.path)) {
      throw new Error(`File ${file.path} does not exist`);
    }

    await super.run(file);
    return new Promise(async (resolve, reject) => {
      let idx = 0;
      const importService = new ImportService();
      await importService.pullAllCategories();
      CsvProcessorService.allCategories = importService.getCategories();

      createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => {
          //look into field map to do any transformations
          const processedRow = this.transformRow(data, idx === 0);

          if (processedRow.isInvalid && this.invalidRows.findIndex(r => r.id === processedRow.data.sku) === -1) {
            this.invalidRows.push({row: idx, fields: processedRow.invalidFields, id: processedRow.data.sku});
            return;
          }

          this.results.push(processedRow.data);
          idx++;
        })
        .on('error', (e) => { console.log(`CSV Processor Error processing file ${file.path}`); reject(e); })
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
  protected transformRow(rowData: any, debug = false): ITransformerResult<IImportSchema> {
    //look into field map to do any transformations and dump the useless stuff
    const data: IImportSchema = {
      properties: [],
      categories: []
    } as IImportSchema;

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

        if (['property', 'category', 'number', 'float', 'image'].indexOf(field.type) === -1) {
          data[field.name] = rowData[key];
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

        if (field.type === 'image') {
          data['image'] = rowData[key];
        }

        if (field.type === 'category') {
          //split first, slugify later
          const parts = rowData[key].split(',');
          data['categories'] = parts.map(p => {

            const found = CsvProcessorService.allCategories
              .filter(c => c['importName'])
              .find(c => c['importName'] === p.trim());

            if (!found) {
              console.log(`Category ${p} not found`);
              isInvalid = true;
              invalidFields.push({key, value: p});
            }

            return found['uuid'];
          });
        }

        if (field.type === 'property') {
          if (['N/A'].indexOf(rowData[key]) !== -1) {return;}
          data['properties'].push({key: key.replace('property.', ''), value: field.slugifyValue ? slug(rowData[key], {trim: true, lower: true}) : rowData[key]});
        }

        if (field.type === 'variantId') {
          data['variantId'] = rowData[key];
          data['variantSlug'] = slug(rowData[key], {trim: true, lower: true});
        }

        if (field.isSlugFor) {
          data[field.isSlugFor] = slug(rowData[key], {trim: true, lower: true});
        }


      });

    if (debug) {
      // console.log(data)
    }


    return {
      data,
      isInvalid,
      invalidFields,
    };
  }

}
