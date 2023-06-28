import { resolve } from "path";
import { IGenericObject } from "~models/general";
import { readFileSync } from "fs";
import { projectRoot } from "~root/main";
const Maizzle = require('@maizzle/framework');

export async function maizzleRenderer(template: string, toMerge: IGenericObject) {
  let html = '',
    config = {};

  try {
    const defaultConfig = require(resolve(projectRoot, 'maizzle-config.production'));
    const buffer = readFileSync(resolve(projectRoot, 'views', template));
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
