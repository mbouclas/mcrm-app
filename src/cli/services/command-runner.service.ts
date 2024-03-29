import * as chalk from 'chalk';
import { _cli, except } from "../helpers/_cli";


export class CommandRunner {
  static async handle(
    command: Record<string, any>,
    args: Record<string, any>
  ): Promise<void> {
    const options = command.options.args || {};

    args = except(args, ["_", "$0", "command"]);

    if (args.options) {
      CommandRunner.printOptions(command, args);
      return;
    }

    const requiredOptions = Object.keys(options).filter((k) => options[k].req);

    const noInputFound = [];
    for (const option of requiredOptions) {
      if (!args[option]) noInputFound.push(option);
    }

    if (noInputFound.length) {
      _cli.error(` Missing arguments: ${noInputFound.join(", ")} `);
      return;
    }


    await (new command.target).handle(args);
    return;
  }

  static printOptions(command: Record<string, any>, args: Record<string, any>) {
    const options = command.options.args || {};
    const commandOptions = [];
    for (const key in options) {
      commandOptions.push({
        name: key,
        description: options[key].desc,
        required: options[key].req ? "Y" : "",
      });
    }

    _cli.info(chalk.bgBlue.whiteBright.bold(" Options "));

    if (commandOptions.length) {
      _cli.table(commandOptions);
    } else {
      _cli.info("No option found for specified command");
    }
  }
}
