import { resolve } from "path";
import { readDirFiles } from "~helpers/readDirFiles";
import { AppStateActions, store } from "~root/state";
import { existsSync } from "fs";

export function loadConfig(name: string, reload = false) {
  if (!reload) {
    const dir = resolve(require('path').resolve('./config'));
    return require(`${dir}/${name}`);

  }
}

export async function loadConfigs(readFrom = './config', merge = false) {
  const dir = resolve(require('path').resolve(readFrom));
  const files = await readDirFiles(dir, ['.js', '.json']);

  for (let i = 0; i < files.length; i++) {
    const config = await import(files[i].fullFileName);
    const name = files[i].fileName.replace('.js', '').replace('.json', '');
    AppStateActions.setConfig(name, config, merge);
  }

/*  files.forEach(file => {
    try {
      const config = require(file.fullFileName);
      const name = file.fileName.replace('.js', '').replace('.json', '');
      AppStateActions.setConfig(name, config, merge);
    }
    catch (e) {
      console.log(e)
    }
  });
  */
}
