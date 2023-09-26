import { Injectable, Optional } from "@nestjs/common";
import { BasePdfDriver, IPdfDriverConfig, IPdfGeneratorResult } from "~root/pdf/drivers/base-pdf-driver";
import { getStoreProperty } from "~root/state";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IGenericObject } from "~models/general";

export interface IPdfServiceOptions {
  saveToObjectStorage: boolean;
}

@Injectable()
export class PdfService {
  driver: BasePdfDriver;
  options: IPdfServiceOptions;

  constructor(@Optional() protected config?: IPdfDriverConfig) {
    if (!config) {
      return;
    }

    const container = McmsDiContainer.get({
      id: config.driver,
    });

    this.driver = new container.reference(config.driverOptions);
    this.options = getStoreProperty('configs.pdf.serviceOptions');
  }

  async generate(data: IGenericObject, templateFile: string, outputFileName?: string): Promise<IPdfGeneratorResult> {
    return await this.driver.generate(data, templateFile, outputFileName);

  }
}
