import { Module } from '@nestjs/common';
import { SyncEsService } from './sync-es.service';
import { SharedModule } from "~shared/shared.module";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    SyncEsService
  ]
})
export class SyncModule {}
