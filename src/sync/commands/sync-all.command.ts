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

  onApplicationBootstrap() {
    setTimeout(async () => {
      const s = new SyncAllCommand();
      await s.handle({});
    }, 3000)
  }

  async handle(args: CommandArguments) {
    const es = new ElasticSearchService(ElasticSearchModule.moduleRef);
    const service = new SyncEsService(
      es,
    );

    const limit = args['limit'] ? parseInt(args['limit'] as string) : 6000;
    const startTime = Date.now();

    try {
      await service.clearIndex();
      _cli.success(`Cleared old data`);
    }
    catch (e) {
      console.log(`PRODUCT_IMPORT_DONE EVENT: Error clearing ES index`, e.message);
    }

    try {
      await service.all(limit, true);
      const endTime = Date.now();
      const timeInMinutes = (endTime - startTime) / 1000 / 60;
      _cli.success(`Syncing all complete in ${timeInMinutes.toFixed(2)} minutes`);
    }
    catch (e) {
      console.error(`Sync one Failed : ${args.id}`, e.message);
      _cli.success(`Syncing ${args.id} failed`);
    }


  }
}
