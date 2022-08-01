import { Injectable } from '@nestjs/common';
import { CliCommand, CommandArguments } from "./cli/decorators/cli-command";
import { _cli } from "./cli/helpers/_cli";
import { OnEvent } from "@nestjs/event-emitter";



@Injectable()
export class AppService {


  getHello(): string {
    return 'Hello World!';
  }

  @CliCommand('hello', {
    desc: 'Test Command',
    args: { name: { req: false } },
  })
  sayHello(args: CommandArguments) {
    console.log(args);
    _cli.info(`Hello ${args.name || 'world'}!`);
    return;
  }
}
