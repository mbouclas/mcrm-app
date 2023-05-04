import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { CommandRunner } from "./services/command-runner.service";
import { AppModule } from "../app.module";


@Module({
  imports: [
    AppModule
  ],
  providers: [
    CommandRunner,
  ]
})
export class CliModule {}
