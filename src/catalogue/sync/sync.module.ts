import { Logger, Module } from "@nestjs/common";
import { SyncEsService } from './sync-es.service';
import { SharedModule } from "~shared/shared.module";
import { ProductConverterService } from "~catalogue/sync/product-converter.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ModuleRef } from "@nestjs/core";
import { ProductEvents } from "~catalogue/sync/event-handlers/product.events";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    SyncEsService,
    ProductConverterService,
    ProductEvents,
  ]
})
export class SyncModule {
  static event: EventEmitter2;
  private readonly logger = new Logger(SyncModule.name);
  static moduleRef: ModuleRef;
  constructor(
    private m: ModuleRef,
    private eventEmitter: EventEmitter2,
  ) {
    SyncModule.moduleRef = m;
    SyncModule.event = eventEmitter;
  }

  async onApplicationBootstrap() {
    this.logger.log(`${SyncModule.name} initialized`);

  }
}
