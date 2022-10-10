import { Injectable } from '@nestjs/common';
import { BaseProcessorService } from "~catalogue/import/services/base-processor";
import {createReadStream} from 'fs';
import { IImportSchema, IProcessorResult, ITransformerResult } from "~catalogue/import/services/import.service";
const csv = require('csv-parser');

@Injectable()
export class CsvProcessorService extends BaseProcessorService {
  results = [];
  invalidRows = [];


  async run(file: Express.Multer.File): Promise<IProcessorResult> {

    await super.run(file);
    return new Promise((resolve, reject) => {
      let idx = 0;

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
        .on('end', () => {
          resolve({
            data: this.results,
            invalidRows: this.invalidRows,
            isInvalid: this.invalidRows.length > 0,
          })
        });
    });

  }


}
