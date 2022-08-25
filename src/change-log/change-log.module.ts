import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { ChangeLogService } from "~change-log/change-log.service";
import { LogModel } from "~change-log/log.model";

@Module({
  imports: [
    SharedModule
  ],
  providers: [
    ChangeLogService,
    LogModel,
  ]
})
export class ChangeLogModule {}
