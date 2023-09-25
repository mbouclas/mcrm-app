import { BasePatch } from "~root/update/base.patch";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";

@McmsDi({
  id: 'TestPatch',
  type: 'patch',
  description: 'A test patch'
})
@Injectable()
export class TestPatch extends BasePatch {

  async run() {
    console.log(`Patch executed`)
  }
}
