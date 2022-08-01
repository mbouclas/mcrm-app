import { Injectable } from "@nestjs/common";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { SCHEMATIC_NAME, SCHEMATIC_OPTIONS } from "../decorators/schematic.decorator";
import { SchematicsMeta } from "../meta-data/schematics-meta";


@Injectable()
export class SchematicExplorerService {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner
  ) {}

  onModuleInit() {
    const wrappers = this.discovery.getProviders();
    wrappers.forEach((w) => {
      const { instance } = w;
      if (
        !instance ||
        typeof instance === "string" ||
        !Object.getPrototypeOf(instance)
      ) {
        return;
      }

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) => this.lookupGenerators(instance, key)
      );
    });
  }

  lookupGenerators(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const hasSchematicMeta = Reflect.hasMetadata(SCHEMATIC_NAME, instance, key);
    const isClassSchematic = Reflect.hasMetadata(
      SCHEMATIC_NAME,
      instance.constructor
    );

    if (!hasSchematicMeta && !isClassSchematic) return;

    if (isClassSchematic && key != "handle") return;

    const schematic =
      Reflect.getMetadata(SCHEMATIC_NAME, instance, key) ||
      Reflect.getMetadata(SCHEMATIC_NAME, instance.constructor);

    const options =
      Reflect.getMetadata(SCHEMATIC_OPTIONS, instance, key) ||
      Reflect.getMetadata(SCHEMATIC_OPTIONS, instance.constructor);

    SchematicsMeta.set(schematic, methodRef.bind(instance), options || {});
  }
}
