import { Body, Controller, Post } from "@nestjs/common";
import { getStoreProperty } from "~root/state";
import { PdfService } from "~root/pdf/pdf.service";
import { IGenericObject } from "~models/general";
import { IsNotEmpty, IsOptional } from "class-validator";
import BaseHttpException from "~shared/exceptions/base-http-exception";

class GeneratePdfPayloadDto {
  @IsNotEmpty()
  template: string; //must be a config string like store.invoices.pdf.templateFile

  @IsNotEmpty()
  data: IGenericObject;

  @IsOptional()
  config: string;
}

@Controller('api/pdf')
export class PdfController {
  @Post('generate')
  async generate(@Body() payload: GeneratePdfPayloadDto) {
    const config = getStoreProperty(payload.config || 'configs.pdf');
    const pdfService = new PdfService(config)
    try {
      await pdfService.generate({name: 'Michael'}, getStoreProperty(`configs.${payload.template}`))
    }
    catch (e) {
      throw new BaseHttpException({
        code: '1400.6',
        error: e,
        reason: e.message,
        statusCode: 500,
      })
    }
  }
}
