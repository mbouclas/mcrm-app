import "reflect-metadata";
import { CommandMeta } from "~cli/meta-data/command-meta";
export const COMMAND_NAME = "__clicommandname__";
export const COMMAND_OPTIONS = "__clicommandoptions__";

export interface CommandOptions {
  desc?: string;
  args?: CommandArguments;
}
export interface Option {
  desc?: string;
  alias?: string;
  req?: boolean;
}

export interface CommandArguments {
  [key: string]: Option;
}

export function CliCommand(command: string, options?: CommandOptions) {
  options = options || ({} as CommandOptions);
  return function (...args: string[] | any[]) {
    switch (args.length) {
      case 1:
        Reflect.defineMetadata(COMMAND_NAME, command, args[0]);
        Reflect.defineMetadata(COMMAND_OPTIONS, options, args[0]);
        break;

      case 3:
        Reflect.defineMetadata(COMMAND_NAME, command, args[0], args[1]);
        Reflect.defineMetadata(COMMAND_OPTIONS, options, args[0], args[1]);
        break;
    }

    CommandMeta.setCommand(command, args[0], options)
  };
}
