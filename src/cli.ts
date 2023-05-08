#!/usr/bin/env node
import { Liquid } from "liquidjs";
import { ListCommand } from "./cli/commands/list.command";
require('dotenv').config();
process.env.MODE = 'cli';
const argv = require('minimist')(process.argv.slice(2));
const colors = require('colors');
import { NestFactory } from "@nestjs/core";
import { CliModule } from "./cli/cli.module";
import { CommandMeta } from "~cli/meta-data/command-meta";
import { Logger } from "~cli/helpers/logger";
import { CommandRunner } from "~cli/services/command-runner.service";
import { createDriver } from "~neo4j/neo4j.util";
import { defaultNeo4JConfig } from "~neo4j/neo4j.module";
import { Neo4jService } from "~neo4j/neo4j.service";

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
    await (new ListCommand()).handle({});
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
