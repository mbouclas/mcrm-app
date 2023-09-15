import { Injectable } from "@nestjs/common";
import { CliCommand, CommandArguments } from "~cli/decorators/cli-command";
import { _cli } from "~cli/helpers/_cli";
import { SyncEsService } from "~catalogue/sync/sync-es.service";
import { HttpService } from "@nestjs/axios";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ElasticSearchModule } from "~es/elastic-search.module";

@Injectable()
@CliCommand('syncAll',{
  desc: 'Sync All data with the mothership',
  args: { limit: { req: false } },
})
export class SyncAllCommand {
  async handle(args: CommandArguments) {
    const service = new SyncEsService(
      new ElasticSearchService(ElasticSearchModule.moduleRef),
    );
    const limit = args['limit'] ? parseInt(args['limit'] as string) : 40;

    try {
      await service.all(limit, true);
      _cli.success(`Syncing all complete`);
    }
    catch (e) {
      console.error(`Sync one Failed : ${args.id}`, e.message);
      _cli.success(`Syncing ${args.id} failed`);
    }


  }
}
