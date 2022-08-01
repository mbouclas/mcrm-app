import { ListCommand } from "./cli/commands/list.command";

require('dotenv').config();
import { NestFactory } from "@nestjs/core";
import { CliModule } from "./cli/cli.module";
import { CommandMeta } from "./cli/meta-data/command-meta";
import { Logger } from "./cli/helpers/logger";
import { CommandRunner } from "./cli/services/command-runner.service";
import { Liquid } from "liquidjs";
import { createDriver } from "~root/neo4j/neo4j.util";
import { defaultNeo4JConfig } from "~root/neo4j/neo4j.module";
import { Neo4jService } from "~root/neo4j/neo4j.service";
const argv = require('minimist')(process.argv.slice(2));
const colors = require('colors');
export interface ICommandResult {
  success: boolean;
  reason?: string;
  return?: any;
}

export let ViewEngine = new Liquid({
  cache: false,
});



async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error', 'warn'],
  });
  const c = argv._[0];
  argv.command = c;

  if (typeof argv['_'][0] == 'undefined' || argv['_'][0] == null) { //show all commands
    console.log(colors.yellow('Available commands'));
    await (new ListCommand()).handle({})
/*    for (let key in cli.commands) {
      console.log(colors.green(key) + ' ::  ' + cli.commands[key].description);
    }*/

    process.exit();
  }
  const command = CommandMeta.getCommand(argv.command);

  if (!command || !command.target) {
    Logger.error(` ${argv.command} : command not found `);
    return process.exit();
  }

  await CommandRunner.handle(command, argv);
  process.exit();

}

createDriver(defaultNeo4JConfig)
  .then(async driver => {
    Neo4jService.driverInstance = driver;
    await bootstrap();
  })
