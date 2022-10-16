import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ImportQueueService } from './services/import-queue.service';
import { ImportService } from './services/import.service';
import { MulterModule } from "@nestjs/platform-express";
import { ImportController } from './controllers/import.controller';
import {resolve} from "path";
import { BaseProcessorService } from "~catalogue/import/services/base-processor";
import { CsvProcessorService } from "~catalogue/import/services/csv-processor.service";
import { PropertiesService } from "~catalogue/import/services/properties.service";
import { ImportTemplateService } from './services/import-template.service';



@Module({
  providers: [
    ImportQueueService,
    ImportService,
    PropertiesService,
    BaseProcessorService,
    CsvProcessorService,
    ImportTemplateService,
  ],
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: resolve(require('path').resolve('./'), './upload'),
      }),
    }),
  ],
  controllers: [ImportController]
})
export class ImportModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ImportModule.name);

  constructor() {
  }

  async onModuleInit() {
    this.logger.log("AppModule initialized");
  }

  async onApplicationBootstrap() {

  }


}
