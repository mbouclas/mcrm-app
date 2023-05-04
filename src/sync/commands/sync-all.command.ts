import { Injectable } from "@nestjs/common";
import { CliCommand, CommandArguments } from "~cli/decorators/cli-command";
import { _cli } from "~cli/helpers/_cli";

@Injectable()
@CliCommand('syncAll',{
  desc: 'Sync All data with the mothership',
  args: { limit: { req: false } },
})
export class SyncAllCommand {
  async handle(args: CommandArguments) {
/*    const service = new SyncService(
      new HttpService(),
      new ElasticSearchService(ElasticSearchModule.moduleRef),
    );*/

    _cli.success(`Syncing ${args.id} failed`);
  }
}
