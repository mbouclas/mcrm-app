import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IBaseFilter } from '~models/general';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PropertyService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.Property;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

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
    const res = await this.neo.readWithCleanUp(query, { ids: uuids });

    const ret = [];
    res.forEach((record) => {
      // First time round for this property
      const found = ret.find((rec) => rec.uuid === record.property.uuid);
      if (!found) {
        ret.push({ ...record.property, ...{ values: [record.value] } });
        return;
      }

      // Been here done that. At some point in the loop we already added this value
      const foundValue = found.values.find((v) => v.uuid === record.value.uuid);
      if (foundValue) {
        return;
      }

      found.values.push(record.value);
    });

    return ret;
  }

  public async getPropertyWithValues(filterBy: IBaseFilter, values?: string[]) {
    const filter = extractSingleFilterFromObject(filterBy);
    const query = `MATCH (property:Property {${filter.key}:'${filter.value}'})-[r:HAS_VALUE]->(value:PropertyValue)
    return property, collect(DISTINCT value) as values;
    `;

    const res = await this.neo.readWithCleanUp(query, {});

    const property = res[0].property;
    // Return all

    if (!Array.isArray(values) || values.length === 0) {
      return { ...property, ...{ values: res[0].values } };
    }

    property.values = res[0].values.filter((val) => values.indexOf(val.uuid) !== -1);

    return property;
  }

  async getValues(uuids: string[], withProperty = false) {
    const withPropertyQuery = !withProperty ? '' : `<-[r:HAS_VALUE]-(property:Property)`;
    const query = `
    UNWIND $uuids as id
    MATCH (value:PropertyValue {uuid: id})${withPropertyQuery}
    return *;   
    `;
    const res = await this.neo.readWithCleanUp(query, { uuids });

    return !withProperty
      ? res.map((record) => record.value)
      : res.map((record) => {
          const temp = record.value;
          return { ...temp, ...{ property: record.property } };
        });
  }

  async getAllPropertyValues() {
    const res = await this.neo.readWithCleanUp(`
    MATCH (value:PropertyValue) return value`);

    return res.map(record => record.value);
  }
}
