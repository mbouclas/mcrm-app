import { resolve } from "path";
import { IGenericObject } from "~models/general";
import { readFileSync } from "fs";
import { projectRoot } from "~root/main";
const Maizzle = require('@maizzle/framework');

export async function maizzleRenderer(template: string, toMerge: IGenericObject, viewsFolder: string = null) {
  let html = '',
    config = {};

  try {
    const defaultConfig = require(resolve(projectRoot, 'maizzle-config.production'));
    const templateFile = viewsFolder ?  resolve(viewsFolder, template) : resolve(projectRoot, 'views', template);
    const buffer = readFileSync(templateFile);
    html = buffer.toString();
    config = Object.assign(defaultConfig, {locals: toMerge});
  }
  catch (e) {
    console.log(e)
  }


  try {
    const res = await Maizzle.render(html, {maizzle: config} );
    return res.html;
  }
  catch (e) {
    console.log(e)
  }
}
