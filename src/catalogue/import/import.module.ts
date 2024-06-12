import { Inject, Logger, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ImportQueueService } from './services/import-queue.service';
import { ImportService } from './services/import.service';
import { MulterModule } from '@nestjs/platform-express';
import { ImportController } from './controllers/import.controller';
import { ImportTemplateController } from './controllers/import-template.controller';
import { join, resolve } from "path";
import { BaseProcessorService } from '~catalogue/import/services/base-processor';
import { CsvProcessorService } from '~catalogue/import/services/csv-processor.service';
import { PropertiesService } from '~catalogue/import/services/properties.service';
import { ImportTemplateService } from './services/import-template.service';
import { ImportProductPhotosService } from '~catalogue/import/services/import-product-photos.service';
import { ImportTemplateModel } from './models/import-template.model';
import { ChangeProductStatusTemplateService } from "~catalogue/import/templates/change-product-status-template.service";
import {
  ChangeProductVariantStatusTemplate
} from "~catalogue/import/templates/change-product-variant-status-template.service";
import {
  AddImagesToVariantsTemplateService
} from "~catalogue/import/templates/add-images-to-variants-template.service";
import { UpdateProductsTemplate } from "~catalogue/import/templates/update-products.template";
import { ImportProductsWithVariantsTemplate } from "~catalogue/import/templates/import-products-with-variants.template";
import { ImportProductsTemplate } from "~catalogue/import/templates/import-products.template";
import { AddImagesToProductsTemplate } from "~catalogue/import/templates/add-images-to-products.template";
import { UpdateProductStatusTemplate } from "~catalogue/import/templates/update-product-status.template";
import { ImportColorsTemplate } from "~catalogue/import/templates/import-colors.template";
import { ImportPropertyValuesTemplate } from "~catalogue/import/templates/import-property-values.template";
import { DeleteVariantsTemplate } from "~catalogue/import/templates/delete-variants.template";
import { WINSTON_MODULE_PROVIDER, WinstonModule } from "nest-winston";
import  { Logger as WinstonLogger } from 'winston';
import { logToFile } from "~helpers/log-to-file";
import { ImportRawImagesTemplate } from "~catalogue/import/templates/import-raw-images.template";
import { BulkDeleteProductsTemplate } from "~catalogue/import/templates/bulk-delete-products.template";
const winston = require('winston');

@Module({
  providers: [
    ImportQueueService,
    ImportService,
    PropertiesService,
    BaseProcessorService,
    CsvProcessorService,
    ImportTemplateService,
    ImportProductPhotosService,
    ImportTemplateModel,
    ChangeProductStatusTemplateService,
    ChangeProductVariantStatusTemplate,
    AddImagesToVariantsTemplateService,
    UpdateProductsTemplate,
    ImportProductsWithVariantsTemplate,
    ImportProductsTemplate,
    AddImagesToProductsTemplate,
    UpdateProductStatusTemplate,
    ImportColorsTemplate,
    ImportPropertyValuesTemplate,
    DeleteVariantsTemplate,
    ImportRawImagesTemplate,
    BulkDeleteProductsTemplate,
  ],
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: resolve(require('path').resolve('./'), './upload'),
      }),
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.File({ filename: join(__dirname, '../../', 'logs', 'imports.log') }),
      ]
    }),
  ],
  controllers: [ImportController, ImportTemplateController],
})
export class ImportModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ImportModule.name);

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logToFile: WinstonLogger) { }

  async onModuleInit() {
    this.logger.log('AppModule initialized');
  }

  async onApplicationBootstrap() {

  }
}
