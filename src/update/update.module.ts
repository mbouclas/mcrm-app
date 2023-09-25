import {  Module, OnApplicationBootstrap } from "@nestjs/common";
import { UpdateService } from './update.service';
import { TestPatch } from "~root/update/test.patch";


@Module({
  providers: [
    UpdateService,
    TestPatch,
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
