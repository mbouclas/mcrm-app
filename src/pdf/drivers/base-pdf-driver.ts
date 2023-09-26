import { IGenericObject } from "~models/general";

export interface IPdfDriverConfig {
  driver: string;
  driverOptions: IPdfDriverOptions;
}
export interface IPdfDriverOptions {
  format: string;
  orientation: string;
  border?: string;
  headerTemplate?: string;
  header?: IPdfHeaderConfig;
  footerTemplate?: string;
  footer?: IPdfFooter;
  outputDirectory: string;
  outputType?: 'stream'|'pdf';
}
export interface IPdfHeaderConfig {
  height: string;
  contents: string;
}
export interface IPdfFooter {
  height: string;
  contents: IPdfContents;
}
export interface IPdfContents {
  default: string;
}

export interface IPdfGeneratorResult {
  filename: string;
}

export class BasePdfDriver {
  constructor(protected options: IPdfDriverOptions) {}

  async generate(data: IGenericObject, templateFile: string, outputFileName?: string): Promise<IPdfGeneratorResult> {
    return {filename: ''}
  }
}
