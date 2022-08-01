import { Liquid } from "liquidjs";
import { dirname, resolve } from "path";
import { IGenericObject } from "~models/general";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as dashify from 'dashify';
import { fileExistsSync } from "tsconfig-paths/lib/filesystem";

interface ISchematicRendererOptions {
  destinationDir: string;
  className: string;
  viewValues: IGenericObject;
  fileSuffix: string;
}

export class SchematicsRenderer {
  engine: Liquid;
  srcDir = resolve(dirname(require.main.filename), '../','src');
  constructor(root: string) {
    root = resolve(this.srcDir, root);
    this.engine = new Liquid({
      cache: false,
      root
    });
  }

  public async save (filename: string, opts: ISchematicRendererOptions) {
    const out = await this.engine.renderFile(filename, opts.viewValues);
    const srcDir = resolve(this.srcDir, opts.destinationDir);

    if (!existsSync(srcDir)) {
      mkdirSync(srcDir);
    }

    const file = `${resolve(this.srcDir, opts.destinationDir, dashify(opts.className))}.${opts.fileSuffix}.ts`;
    try {
      writeFileSync(file, out, 'utf-8');
    }
    catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }
}
