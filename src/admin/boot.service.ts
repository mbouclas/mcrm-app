import { Injectable } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { GateService } from "~root/auth/gate.service";
import { store } from "~root/state";

@Injectable()
export class BootService extends BaseNeoService {
  async boot() {
    const gates = await (new GateService()).find({ limit: 100 });
    const allModels = store.getState().models;
    const models = Object.keys(allModels)
      .filter(key => Array.isArray(allModels[key].fields) && allModels[key].fields.length > 0)
      .map(key => ({
        name: allModels[key].name,
        fields: allModels[key].fields
      }));

    return {
      gates: gates.data,
      models
    };
  }
}
