import { Module } from '@nestjs/common';
import { ProductsSyncAstroController } from './products-sync-astro.controller';
import { ProductsSyncAstroService } from './products-sync-astro.service';
import { PropertiesSyncAstroController } from "~root/sync/properties-sync-astro.controller";
import { SyncAllCommand } from "~root/sync/commands/sync-all.command";
import { SharedModule } from "~shared/shared.module";


@Module({
  imports: [
    SharedModule,
  ],
  controllers: [
    ProductsSyncAstroController,
    PropertiesSyncAstroController,
  ],
  providers: [
    ProductsSyncAstroService,
    SyncAllCommand,
  ]
})
export class SyncModule {}
