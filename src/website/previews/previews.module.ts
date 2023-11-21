import { Module } from '@nestjs/common';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';

@Module({
  controllers: [PreviewController],
  providers: [PreviewService]
})
export class PreviewsModule {}
