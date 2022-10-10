import { resolve } from "path";
import { readDirFiles } from "~helpers/readDirFiles";
import { AppStateActions, store } from "~root/state";

export function loadConfig(name: string, reload = false) {
  if (!reload) {
    const dir = resolve(require('path').resolve('./config'));
    return require(`${dir}/${name}`);

  }
}

export async function loadConfigs() {
  const dir = resolve(require('path').resolve('./config'));
  const files = await readDirFiles(dir, ['.js', '.json']);
  files.forEach(file => {
    const config = require(file.fullFileName);
    const name = file.fileName.replace('.js', '').replace('.json', '');
    AppStateActions.setConfig(name, config);
  });
}
