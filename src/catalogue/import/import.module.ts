import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ImportQueueService } from './services/import-queue.service';
import { ImportService } from './services/import.service';
import { MulterModule } from "@nestjs/platform-express";
import { ImportController } from './controllers/import.controller';
import {resolve} from "path";
import { BaseProcessorService } from "~catalogue/import/services/base-processor";
import { CsvProcessorService } from "~catalogue/import/services/csv-processor.service";



@Module({
  providers: [
    ImportQueueService,
    ImportService,
    BaseProcessorService,
    CsvProcessorService,
  ],
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: resolve(require('path').resolve('./'), '../upload'),
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
