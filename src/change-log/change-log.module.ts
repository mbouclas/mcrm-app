import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { ChangeLogService } from "~change-log/change-log.service";

@Module({
  imports: [
    SharedModule
  ],
  providers: [
    ChangeLogService,
  ]
})
export class ChangeLogModule {}
