import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ImportQueueService } from './services/import-queue.service';
import { ImportService } from './services/import.service';

@Module({
  providers: [ImportQueueService, ImportService]
})
export class ImportModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ImportModule.name);

  constructor() {
  }

  async onModuleInit() {
    this.logger.log("AppModule initialized");
  }

  async onApplicationBootstrap() {

  }


}
