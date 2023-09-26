import { Injectable } from '@nestjs/common';
import { BasePdfDriver, IPdfGeneratorResult } from "~root/pdf/drivers/base-pdf-driver";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { IGenericObject } from "~models/general";
import { readFileSync } from "fs";
import { CannotGeneratePdfException } from "~root/pdf/cannot-generate-pdf.exception";
import { resolve } from "path";
import { v4 } from "uuid";



@McmsDi({
  id: 'PdfCreator',
  type: 'driver',
  description: 'Driver implementation for pdf-creator'
})
@Injectable()
export class PdfCreatorDriver extends BasePdfDriver {

  async generate(data: IGenericObject, templateFile: string, outputFileName?: string): Promise<IPdfGeneratorResult> {
    if (!outputFileName) {
      outputFileName = resolve(this.options.outputDirectory, `${v4()}.pdf`);
    }

    const document = {
      html: readFileSync(templateFile, "utf8"),
      data,
      path: outputFileName,
      type: this.options.outputType || "pdf",
    };

    const pdf = require("pdf-creator-node");

    try {
      return await pdf.create(document, this.options);
    }
    catch (e) {
      console.log(`Error Generating PDF`, e);
      throw new CannotGeneratePdfException(`ERROR_GENERATING_PDF`, `1400.1`, e);
    }
  }
}
