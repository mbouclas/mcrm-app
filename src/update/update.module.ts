import {  Module, OnApplicationBootstrap } from "@nestjs/common";
import { UpdateService } from './update.service';
import { TestPatch } from "~root/update/test.patch";
import {
  AddModulesConfigFileToClientConfigsUpdate
} from "../../updates/add-modules-config-file-to-client-configs.update";
import { UpdateEsMappingsForVariantsUpdate } from "../../updates/update-es-mappings-for-variants.update";


@Module({
  providers: [
    UpdateService,
    TestPatch,
    AddModulesConfigFileToClientConfigsUpdate,
    UpdateEsMappingsForVariantsUpdate
  ]
})
export class UpdateModule implements OnApplicationBootstrap {

  async onApplicationBootstrap() {
    setTimeout(async () => {
      const s = new UpdateService();

      // read all patches
      await s.getPatches()
    }, 1000)

  }
}
