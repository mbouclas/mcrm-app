import { Module } from '@nestjs/common';
import { ProductsSyncAstroController } from './products-sync-astro.controller';
import { ProductsSyncAstroService } from './products-sync-astro.service';

@Module({
  controllers: [ProductsSyncAstroController],
  providers: [ProductsSyncAstroService]
})
export class SyncModule {}
