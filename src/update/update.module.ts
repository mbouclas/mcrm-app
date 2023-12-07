import {  Module, OnApplicationBootstrap } from "@nestjs/common";
import { UpdateService } from './update.service';
import { TestPatch } from "~root/update/test.patch";
import {
  AddModulesConfigFileToClientConfigsUpdate
} from "../../updates/add-modules-config-file-to-client-configs.update";
import { UpdateEsMappingsForVariantsUpdate } from "../../updates/update-es-mappings-for-variants.update";
import { AddStatusToEsProductIndexUpdate } from "~updates/add-status-to-es-product-index.update";
import { UpdateEsMappingsForRelatedUpdate } from "~updates/update-es-mappings-for-related.update";


@Module({
  providers: [
    UpdateService,
    TestPatch,
    AddModulesConfigFileToClientConfigsUpdate,
    UpdateEsMappingsForVariantsUpdate,
    AddStatusToEsProductIndexUpdate,

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
