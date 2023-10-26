import { BaseProcessorService, IImportProcessorFieldMap } from "~catalogue/import/services/base-processor";
import { IInvalidField } from "~catalogue/import/services/import.service";
import { Optional } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { ErrorBackingUpDbException } from "~catalogue/import/exceptions/error-backing-up-db.exception";
import { ErrorRestoringDbException } from "~catalogue/import/exceptions/error-restoring-db.exception";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import { Job, Processor, Queue } from "bullmq";
import { ImportTemplateRegistry } from "~catalogue/import/decorators/import-template-registry.decorator";

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
  success: boolean;
  rowsProcessed: number;
}

export interface IBaseImportJob {
  file: Partial<Express.Multer.File>;
  template: string;
}

export class BaseImportService {
  name: string;
  type: string;
  description: string;
  jobEventName = 'importJob';
  fieldMap: IImportProcessorFieldMap[] = [];
  static fieldMap: IImportProcessorFieldMap[] = [];
  processor: BaseProcessorService = new BaseProcessorService();
  settings: IBaseImportServiceSettings = {
    delimiter: ',',
  };


  async onApplicationBootstrap() {
    if (this['worker'] && typeof this['worker'] === 'function') {
      ImportQueueService.addWorker(this['worker'], ImportQueueService.queueName);
    }
  }

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

    if (Array.isArray((new.target).fieldMap)) {
      this.fieldMap = [...(new.target).fieldMap, ...this.fieldMap];
    }


    if (Array.isArray(this.fieldMap) && this.fieldMap.length > 0) {
      this.processor.setFieldMap(this.fieldMap);
    }

  }

  async backupDb() {
    try {
      const res = await (new BaseNeoService()).neo.backupDb();

      return res;
    }
    catch (e) {
      console.log(`Error backing up database`, e);
      throw new ErrorBackingUpDbException(`ERROR_BACKING_UP_DB`, `1700.2`, {message: e.message});
    }
  }

  async restoreDb() {
    throw new ErrorRestoringDbException(`ERROR_RESTORING_DB`, `1700.3`, {message: `Not implemented`});
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
    return Promise.resolve({
      success: true,
      rowsProcessed: 0,
    });
  }

  getHandler(template: string) {
    const container = ImportTemplateRegistry.get({id: template});

    if (!container) {
      throw new Error(`Import Worker: Could not find container for ${template}`);
    }


    return new container.reference() as BaseImportService;
  }

  async worker(job: Job<Partial<IBaseImportJob>>) {
    console.log(`Processing job ${job.id}`);

    const handler = this.getHandler(job.data.template);

    try {
      await handler.process(job.data.file);
    }
    catch (e) {
      console.log(`Error processing import job ${job.id}`, e);
    }
  }
}
