import { Injectable } from "@nestjs/common";
import { IImportSchema, ITransformerResult } from "~catalogue/import/services/import.service";
const slug = require('slug');

export interface IImportProcessorFieldMap {
  name: string;
  importFieldName: string;
  rename?: boolean;
  required?: boolean;
  type?: 'text'|'number'|'float'|'category'|'property'|'image'|'variantId';
  relationships?: string[];//graph rels. If present they must be the ones present on the model
  validations?: Function[],// list of validations to run, each entry is a function
  isSlugFor?: string;
  matchSourceValue?: string;
  matchTargetValue?: string;
  slugifyValue?: boolean;
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


}
