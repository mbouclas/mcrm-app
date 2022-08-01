import { CliCommand } from "../decorators/cli-command";
import { SchematicsMeta } from "../meta-data/schematics-meta";
import { _cli } from "../helpers/_cli";
import { CommandRunner } from "../services/command-runner.service";
import { SchematicArguments } from "../decorators/schematic.decorator";

@CliCommand('g', {
  desc: 'Generate a component',
  args: {
    name: { desc: 'Name of the component to generate', req: false },
  },
})
export class GenerateCommand {
  async handle(options: SchematicArguments): Promise<void> {
    const schematics = SchematicsMeta.all();
    const keys = Object.keys(schematics).sort().reverse();

    // Show the list to the user
    const choice = await _cli.select('What do you want to generate?', keys, false);

    await CommandRunner.handle(schematics[choice as string], options)
    // Now pass the control to the schematic
/*    const list = keys.map(key => {
      const options = schematics[key].options || {};
      const schematic = schematics[key];

      return {
        command: chalk.greenBright.bold(key),
        description: options.desc || "Schematic Description",
      }
    });

    _cli.table(list);*/
  }
}
