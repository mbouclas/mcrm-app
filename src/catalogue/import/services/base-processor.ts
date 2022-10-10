import { Injectable } from "@nestjs/common";
import { IImportSchema, ITransformerResult } from "~catalogue/import/services/import.service";
const slug = require('slug');

export interface IImportProcessorFieldMap {
  name: string;
  importFieldName: string;
  rename?: boolean;
  required?: boolean;
  type?: 'text'|'number'|'float'|'category'|'property'|'image';
  relationships?: string[];//graph rels. If present they must be the ones present on the model
  validations?: Function[],// list of validations to run, each entry is a function
  isSlugFor?: string;
  matchSourceValue?: string;
  matchTargetValue?: string;
}

@Injectable()
export class BaseProcessorService {
  protected fieldMap: IImportProcessorFieldMap[] = [];

  public setFieldMap(fields: IImportProcessorFieldMap[]) {
    this.fieldMap = fields;
    return this;
  }

  async run(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  protected transformRow(rowData: any, debug = false): ITransformerResult {
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

        if (['property', 'category', 'number', 'float'].indexOf(field.type) === -1) {
          data[field.name] = rowData[key];
        }

        if (field.type === 'number') {
          data[field.name] = parseInt(rowData[key]);
        }

        if (field.type === 'float') {
          data[field.name] = parseFloat(rowData[key]);
        }

        if (field.type === 'category') {

          data['categories'] = slug(rowData[key].trim(), {lower: true}).split(',');
        }

        if (field.type === 'property') {
          if (['N/A'].indexOf(rowData[key]) !== -1) {return;}
          data['properties'].push({key: key.replace('property.', ''), value: rowData[key]});
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
