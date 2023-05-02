import { Module } from '@nestjs/common';
import { ProductsSyncAstroController } from './products-sync-astro.controller';
import { ProductsSyncAstroService } from './products-sync-astro.service';
import { PropertiesSyncAstroController } from "~root/sync/properties-sync-astro.controller";

@Module({
  controllers: [
    ProductsSyncAstroController,
    PropertiesSyncAstroController,
  ],
  providers: [ProductsSyncAstroService]
})
export class SyncModule {}
