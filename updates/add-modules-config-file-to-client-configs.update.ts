import { BasePatch } from "~root/update/base.patch";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { writeFile } from "fs/promises";

@McmsDi({
  id: 'AddModulesConfigFileToClientConfigs',
  type: 'patch',
  description: 'Adds a modules.js config file to the client configs'
})
@Injectable()
export class AddModulesConfigFileToClientConfigsUpdate extends BasePatch {
  async run() {
    await writeFile('client-configs/models.js', `
/**
 * The purpose of this file is to override the models or even add new ones
 * @type {{models: {}}}
 */
module.exports = {
  models: {}
}
`, 'utf-8');

    console.log(`Added client-configs/models.js`);
  }
}
