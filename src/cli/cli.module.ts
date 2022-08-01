import { Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { SharedModule } from "../shared/shared.module";
import { CrmModule } from "../crm/crm.module";
import { AdminModule } from "../admin/admin.module";
import { ListCommand } from "./commands/list.command";
import { ConsoleExplorer } from "./services/expolorer.service";
import { DiscoveryModule } from "@nestjs/core";
import { GenerateCommand } from "./commands/generate.command";
import { SchematicExplorerService } from "./services/schematic-explorer.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Module({
  providers: [
    ListCommand,
    GenerateCommand,
    ConsoleExplorer,
    SchematicExplorerService,
  ],
  imports: [
    DiscoveryModule,
    SharedModule,
    CrmModule,
    AdminModule,
  ]
})
export class CliModule implements OnModuleInit, OnApplicationBootstrap {
  constructor(private eventEmitter: EventEmitter2) {
  }

  onApplicationBootstrap(): any {
    SharedModule.eventEmitter = this.eventEmitter;
  }

  async onModuleInit() {
    console.log("Cli Module initialized");

  }

}
