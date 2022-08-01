import { Injectable } from "@nestjs/common";
import { CliCommand, CommandArguments } from "../../cli/decorators/cli-command";
import { _cli } from "../../cli/helpers/_cli";


@Injectable()
@CliCommand('index',{
  desc: 'Index All data to ES',
  args: { name: { req: false } },
})
export class IndexToEsCommand {
    handle(args: CommandArguments) {
      console.log(args);
      _cli.info(`Hello ${args.name || 'world'}!`);
      return;
    }
}
