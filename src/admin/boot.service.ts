import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { GateService } from '~root/auth/gate.service';
import { store } from '~root/state';
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class BootService extends BaseNeoService {
  @OnEvent('app.loaded')
  async onAppLoaded() {
    await (new BootService().boot())

  }
  async boot() {
    const gates = await new GateService().find({ limit: 100 });
    const allModels = store.getState().models;
    const configs = store.getState().configs;

    const models = Object.keys(allModels)
      .filter(key => allModels[key] && allModels[key].modelConfig)
      .filter(
        (key) => {
          return Array.isArray(allModels[key].fields) && allModels[key].fields.length > 0;
        }
      )
      .map((key) => {
        // console.log('ALLLLL MODELS', allModels[key].name);
        return {
          name: allModels[key].name,
          fields: allModels[key].fields,
          relationships: allModels[key].modelConfig.relationships,
        };
      });

    return {
      gates: gates.data,
      models,
      configs,
    };
  }
}
