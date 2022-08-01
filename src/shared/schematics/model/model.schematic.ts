import { Schematic, SchematicArguments } from "~cli/decorators/schematic.decorator";
import { _cli } from "~cli/helpers/_cli";
import { SchematicsRenderer } from "~cli/helpers/schematics-renderer";


@Schematic('Model',{
  desc: 'Generate a new model'
})
export class ModelSchematic {
  async handle(options: SchematicArguments) {

    const className = await _cli.ask('Name of the model?');
    const moduleName = await _cli.ask('Name of the module?');
    const suggestedDestinationDir = `${moduleName}/models`;
    const destinationDir = await _cli.ask('Destination Directory', suggestedDestinationDir);
/*    const modelType = await _cli.select('What type is it?', [
      'Generic',
      'Location'
    ], false);*/
    const renderer = new SchematicsRenderer('shared/schematics/model');

    try {
      await renderer.save('model.schematic.liquid', {
        destinationDir,
        className,
        fileSuffix: 'model',
        viewValues: {
          className,
          classNameLower: className.toLocaleLowerCase(),
        }
      });
    }
    catch (e) {
      console.log(e)
    }

    _cli.success(`Don't forget to add the model to the providers array`);
  }
}
