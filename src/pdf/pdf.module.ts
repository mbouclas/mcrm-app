import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PdfCreatorDriver } from './drivers/pdf-creator.driver';


@Module({
  providers: [
    PdfService,
    PdfCreatorDriver
  ],
  controllers: [PdfController]
})
export class PdfModule {}
