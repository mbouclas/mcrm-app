import { Module } from '@nestjs/common';
import { ProductsSyncAstroController } from './products-sync-astro.controller';
import { ProductsSyncAstroService } from './products-sync-astro.service';
import { PropertiesSyncAstroController } from "~root/sync/properties-sync-astro.controller";
import { SyncAllCommand } from "~root/sync/commands/sync-all.command";
import { SharedModule } from "~shared/shared.module";
import { MenusSyncAstroService } from "~root/sync/menus-sync-astro.service";


@Module({
  imports: [
    SharedModule,
  ],
  controllers: [
    ProductsSyncAstroController,
    PropertiesSyncAstroController,
    MenusSyncAstroService,
  ],
  providers: [
    ProductsSyncAstroService,
    SyncAllCommand,
  ]
})
export class SyncModule {}
