import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { GateService } from '~root/auth/gate.service';
import { store } from '~root/state';
import { OnEvent } from "@nestjs/event-emitter";
import { zodToJsonSchema } from "zod-to-json-schema";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { ZodSchema } from "zod";
import { SalesChannelsService } from "~sales-channels/sales-channels.service";

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
    const salesChannels = await new SalesChannelsService().find({}, [])

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
          fields: parseModelFields(allModels[key].fields),
          relationships: allModels[key].modelConfig.relationships,
          fieldGroups: allModels[key].fieldGroups || [],
        };
      });

    return {
      gates: gates.data,
      models,
      configs,
      salesChannels: salesChannels.data,
    };
  }
}

function parseModelFields(fields: IDynamicFieldConfigBlueprint[]) {
  return fields.map(field => {
    if (field.schema && field.schema instanceof ZodSchema) {
      field.schema = zodToJsonSchema(field.schema);
    }

    return field;
  })
}
