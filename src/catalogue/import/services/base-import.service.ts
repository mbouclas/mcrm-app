import { BaseProcessorService, IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { IInvalidField } from "~catalogue/import/services/import.service";
import { Optional } from "@nestjs/common";

export interface IBaseImportServiceSettings {
  delimiter: ','|'|'|';'|' ';
}

export interface IBaseProcessorSchema {

}

export interface IBaseProcessorInvalidRows {
  id: string | number;
  row: number;
  fields: {
    key: string;
    value: string;
  }[];
}

export interface IBaseProcessorResult {
  data: IBaseProcessorSchema[];
  isInvalid: boolean;
  invalidRows: IBaseProcessorInvalidRows[];
  validRows: number;
}

export interface IBaseImportServiceArgs {
  fieldMap: IImportProcessorFieldMap[];
  processor?: typeof BaseProcessorService;
  settings?: Partial<IBaseImportServiceSettings>
}

export interface IBaseTransformerResult<T> {
  data: T;
  isInvalid: boolean;
  invalidFields: IBaseProcessorInvalidRows[];
}

export interface IBaseProcessResult {

}

export class BaseImportService {
  name: string;
  type: string;
  description: string;
  fieldMap: IImportProcessorFieldMap[] = [];
  processor: BaseProcessorService = new BaseProcessorService();
  settings: IBaseImportServiceSettings = {
    delimiter: ',',
  };

  constructor(@Optional() args?: IBaseImportServiceArgs) {
    if (args) {
      for (const key in args) {
        this[key] = args[key];
      }

      if (args.settings) {
        this.settings = Object.assign(this.settings, args.settings);
      }

      this.processor.setFieldMap(args.fieldMap);
    }

    if (Array.isArray(this.fieldMap) && this.fieldMap.length > 0) {
      this.processor.setFieldMap(this.fieldMap);
    }

  }

  /**
   * Analyze the file and return valid and invalid rows. It also transforms the CSV data into data based on the field map
   * @param file
   */
  async analyze(file: Partial<Express.Multer.File>): Promise<IBaseProcessorResult> {
    try {
      return await this.processor.run(file);
    }
    catch (e) {
      console.log(`Error analyzing file ${file.filename}`, e);
    }
  }

  /**
   * Do the actual work here
   * @param file
   */
  async process(file: Partial<Express.Multer.File>): Promise<IBaseProcessResult> {
    return Promise.resolve({} as IBaseProcessorResult);
  }
}
