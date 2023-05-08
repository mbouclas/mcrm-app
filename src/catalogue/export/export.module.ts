import { Logger, Module } from "@nestjs/common";
import { SharedModule } from "~shared/shared.module";
import { ProductModule } from "~catalogue/product/product.module";
import { SyncElasticSearchService } from "~catalogue/export/sync-elastic-search.service";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ExportController } from './export.controller';


@Module({
  imports: [
    SharedModule,
    ProductModule,
  ],
  providers: [
    SyncElasticSearchService
  ],
  controllers: [ExportController]
})
export class ExportModule {
  private readonly logger = new Logger(ExportModule.name);

  constructor(
    protected service: SyncElasticSearchService,
    protected es: ElasticSearchService,
  ) {
  }

  async onModuleInit() {
    this.logger.log(`${ExportModule.name} initialized`);
    // setTimeout(() => SharedModule.eventEmitter.emit(SyncElasticSearchService.onSyncSingleEvent, {slug: 'betty'}), 1000)

  }
}
