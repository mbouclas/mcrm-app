import { Schematic, SchematicArguments } from "~cli/decorators/schematic.decorator";
import { _cli } from "~cli/helpers/_cli";
import { SchematicsRenderer } from "~cli/helpers/schematics-renderer";
import { ModelSchematic } from "~shared/schematics/model/model.schematic";


@Schematic('Service',{
  desc: 'Generate a new service'
})
export class ServiceSchematic {
  async handle(options: SchematicArguments) {
    const createModel = await _cli.select('Create a Model first?', ['No', 'Yes']);
    if (createModel === 'Yes') {
      await (new ModelSchematic()).handle({});
    }

    const className = await _cli.ask('Name of the service?');
    let modelName = await _cli.ask('Name of the model?', className);
    if (!modelName || modelName.length === 0) {modelName = className;}
    const moduleName = await _cli.ask('Name of the module?');
    const suggestedDestinationDir = `${moduleName}/services`;
    const destinationDir = await _cli.ask('Destination Directory', suggestedDestinationDir);

    const renderer = new SchematicsRenderer('shared/schematics/service');

    try {
      await renderer.save('service.schematic.liquid', {
        destinationDir,
        className,
        fileSuffix: 'service',
        viewValues: {
          className,
          classNameLower: className.toLocaleLowerCase(),
          modelName,
          moduleName,
        }
      });
    }
    catch (e) {
      console.log(e)
    }

    _cli.success(`Don't forget to add the service to the providers array`);
  }
}
