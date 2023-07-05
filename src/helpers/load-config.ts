import { resolve } from "path";
import { readDirFiles } from "~helpers/readDirFiles";
import { AppStateActions, store } from "~root/state";
import { existsSync } from "fs";
import { SharedEventNames, SharedModule } from "~shared/shared.module";

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
    let config = await import(files[i].fullFileName);
    if (config.default) {
      config = config.default;
    }

    const name = files[i].fileName.replace('.js', '').replace('.json', '');
    AppStateActions.setConfig(name, config, merge);
    // In case there's any further processing of the config files
    SharedModule.eventEmitter.emit(SharedEventNames.CONFIG_LOADED, { name, config })
  }

}
