import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { IGenericObject } from "~models/general";

export interface ISalesChannel {
  uuid: string;
  title: string;
  description: string;
  slug: string;
  active: string;
  settings: IGenericObject;
}

@Injectable()
export class SalesChannelsService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.SalesChannel;
  }

  async syncToModel(modelName: string, itemId: string, channels: Partial<ISalesChannel>[]) {
    // reset the rels for this model and then add the new ones
    const resetQuery = `
      MATCH (m:${modelName} {uuid: $itemId})
      OPTIONAL MATCH (m)-[r:BELONGS_TO]->()
      DELETE r
    `;
    try {
      await this.neo.write(resetQuery, {itemId});
    }
    catch (e) {
      console.log(`COULD NOT RESET RELS FOR ${modelName} ${itemId}`);
    }

    channels.forEach(channel => {
      if (!channel.settings) {
        channel.settings = {};
      }

      channel.settings.visible = channel.settings.visible || true;

    })

    const query = `
      MATCH (m:${modelName} {uuid: $itemId})
      UNWIND $channels as channel
      MATCH (sc:SalesChannel {uuid: channel.uuid})
      MERGE (m)-[r:BELONGS_TO]->(sc)
      ON CREATE SET r.createdAt = datetime(), r.visible = channel.settings.visible
      ON MATCH SET r.updatedAt = datetime(), r.visible = channel.settings.visible
    `;

    try {
      await this.neo.write(query, {itemId, channels});
    }
    catch (e) {
      console.log(`COULD NOT SYNC ${modelName} ${itemId} TO SALES CHANNELS`, e);
    }

    return {success: true};
  }
}
