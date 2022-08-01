import "reflect-metadata";
export const SCHEMATIC_NAME = "__schematicname__";
export const SCHEMATIC_OPTIONS = "__schematicoptions__";

export interface SchematicOptions {
  desc?: string;
  args?: SchematicArguments;
}
export interface Option {
  desc?: string;
  alias?: string;
  req?: boolean;
}

export interface SchematicArguments {
  [key: string]: Option;
}

/**
 * Registers a new schematic with the system
 * @param name
 * @param options
 * @constructor
 */
export function Schematic(name: string, options?: SchematicOptions) {
  options = options || ({} as SchematicOptions);
  return function (...args: string[] | any[]) {
    switch (args.length) {
      case 1:
        Reflect.defineMetadata(SCHEMATIC_NAME, name, args[0]);
        Reflect.defineMetadata(SCHEMATIC_OPTIONS, options, args[0]);
        break;

      case 3:
        Reflect.defineMetadata(SCHEMATIC_NAME, name, args[0], args[1]);
        Reflect.defineMetadata(SCHEMATIC_OPTIONS, options, args[0], args[1]);
        break;
    }
  }
}
