import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IBaseFilter } from "~models/general";

@Injectable()
export class PropertyService extends BaseNeoService {

  /**
   * Get all properties with their values assigned to this model
   * @param model
   * @param modelUuid
   * @param uuids
   */
  async propertiesWithValuesByModel(model: string, modelUuid: string, uuids: string[]) {

    const query = `
      UNWIND $ids as id
      MATCH (model:${model} {uuid: '${modelUuid}'})
      MATCH (model)-[r:HAS_PROPERTY_VALUE]->(value:PropertyValue)<-[rp:HAS_VALUE]->(property:Property)
      return *;
    `;
    // This is where the fun part begins. We get back all the properties attached to their values. We need to group them by property that includes the values as a child
    const res = await this.neo.readWithCleanUp(query, {ids: uuids})

    const ret = []
    res.forEach(record => {
      // First time round for this property
      const found = ret.find(rec => rec.uuid === record.property.uuid)
      if (!found) {
        ret.push({...record.property, ...{values: [record.value]}});
        return;
      }

      // Been here done that. At some point in the loop we already added this value
      const foundValue = found.values.find(v => v.uuid === record.value.uuid);
      if (foundValue) {return;}

      found.values.push(record.value);
    });

    return ret;
  }
}
