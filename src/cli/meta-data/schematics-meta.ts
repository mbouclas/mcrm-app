import { CommandOptions } from "../decorators/cli-command";


export class SchematicsMeta {
  private static schematics: Record<string, any> = {};

  /**
   * Add a schematic to the list
   * @param schematic
   * @param target
   * @param options
   */
  static set(
    schematic: string,
    target: Function,
    options?: CommandOptions,
  ) {
    SchematicsMeta.schematics[schematic] = { target, options };
    return;
  }

  static all(): Record<string, any> {
    return SchematicsMeta.schematics;
  }

  static get(schematic: string): Record<string, any> | null {
    if (!schematic) return null;
    const obj = SchematicsMeta.schematics[schematic];
    return obj || null;
  }

  static getTarget(schematic: string): Function | null {
    const obj = SchematicsMeta.schematics[schematic];
    return obj ? obj.target : null;
  }
}
