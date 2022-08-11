import { Module, OnModuleInit } from "@nestjs/common";
import { ModelsService } from './services/models.service';
import { SharedModule } from "~shared/shared.module";
import { ModuleRef } from "@nestjs/core";
import { GatesModel } from "./models/gates.model";
import { BootController } from './boot.controller';
import { BootService } from './boot.service';

@Module({
  providers: [
    ModelsService,
    GatesModel,
    BootService,
  ],
  imports: [
    SharedModule,
  ],
  controllers: [BootController]
})
export class AdminModule implements OnModuleInit {
  static moduleRef: ModuleRef;
  constructor(private m: ModuleRef) {

  }

  onModuleInit(): any {
    AdminModule.moduleRef = this.m;
  }

  static getService(service: any) {
    return AdminModule.moduleRef.get(service);
  }
}
