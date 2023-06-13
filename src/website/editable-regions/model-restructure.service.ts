import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { ModelNotFoundException } from "~shared/exceptions/mdel-not-found.exception";
import { IMcmsDiRegistryItem, McmsDiContainer } from "~helpers/mcms-component.decorator";
import { capitalize } from "lodash";
import { BaseModel } from "~models/base.model";


export class ModelRestructureService  {
  public neoService: BaseNeoService;
  constructor(model: string) {
    let container: IMcmsDiRegistryItem,
    Model: typeof BaseModel;

    try {
      Model = store.getState().models[model];
    }
    catch (e) {
      throw new ModelNotFoundException('MODEL_NOT_FOUND', '101.11');
    }


    // First we try to blindly get a service that may match the model. If it fails, we go to a generic one
    container = McmsDiContainer.get({id: `${capitalize(model)}Service`});

    if (container) {
      this.neoService = new container.reference();
      return;;
    }

    // Fallback to a base service
    this.neoService = new BaseNeoService();
    this.neoService.setModel(Model);


  }

}
