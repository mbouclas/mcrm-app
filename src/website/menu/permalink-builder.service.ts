import { Injectable } from "@nestjs/common";
import { McmsDi, McmsDiContainer } from "~helpers/mcms-component.decorator";
import { BaseModel } from "~models/base.model";
import { capitalize } from "lodash";
import { sprintf } from "sprintf-js";
import { CouldNotBuildPermalinkException } from "~website/exceptions/could-not-build-permalink.exception";
import { IGenericObject } from "~models/general";

@McmsDi({
  id: 'PermalinkBuilderService',
  type: 'service',
})
@Injectable()
export class PermalinkBuilderService {
  build(modelName: string, item: IGenericObject) {

    const container = McmsDiContainer.findOne({id: modelName});
    if (!container) {
      throw new CouldNotBuildPermalinkException('MODEL_NOT_FOUND', '999.1', {modelName, item});
    }

    const model = new container.reference();
    if (!model) {
      throw new CouldNotBuildPermalinkException('MODEL_REFERENCE_NOT_FOUND', '999.2', {modelName, item});
    }


    if (!model.slugPattern) {
      throw new CouldNotBuildPermalinkException('NO_SLUG_PATTERN_FOUND', '999.3', {modelName, item});
    }

    try {
      return sprintf(model.slugPattern, item);
    }
    catch (e) {
      throw new CouldNotBuildPermalinkException('COULD_NOT_BUILD_PERMALINK', '999.4', {modelName, item});
    }
  }
}
