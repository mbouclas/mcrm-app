import { McmsDi } from '~helpers/mcms-component.decorator';
import { Neo4jService } from '~root/neo4j/neo4j.service';
import { IBaseFilter, IGenericObject, IPagination } from '~models/general';
import { BaseModel, INeo4jModel, INeo4jModelRelationshipConfig } from '~models/base.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SharedModule } from '~shared/shared.module';
import { extractFiltersFromObject, extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import {
  extractQueryParamsFilters,
  modelPostProcessing,
  modelsPostProcessing,
  setupRelationShipsQuery,
} from '~helpers/extractQueryParamsFilters';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { v4 } from 'uuid';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { postedDataToUpdatesQuery } from '~helpers/postedDataToUpdatesQuery';
import { RecordDeleteFailedException } from '~shared/exceptions/record-delete-failed.exception';
import { RecordUpdateFailedException } from '~shared/exceptions/record-update-failed-exception';
import { store } from '~root/state';
import { capitalizeFirstLetter } from '~helpers/capitalizeFirstLetter';
import { fromRecordToModel } from '~helpers/fromRecordToModel';
import { range } from 'lodash';

const debug = require('debug')('mcms:neo:query');

const flattenObj = (record, baseKey, nested) => {
  for (const key in nested) {
    const capitalKey = capitalizeFirstLetter(key);
    const nestedKey = `${baseKey}${capitalKey}`;

    record[nestedKey] = nested[key];
  }
};

@McmsDi({
  id: 'BaseNeoService',
  type: 'service',
})
export class BaseNeoService {
  neo: Neo4jService;
  protected logQuery: debug.IDebugger = debug('mcms:neo:query');
  logger = debug;
  protected eventEmitter: EventEmitter2;
  protected model: typeof BaseModel;

  constructor() {
    this.neo = new Neo4jService();
    this.eventEmitter = SharedModule.eventEmitter;
  }

  setModel(model: typeof BaseModel) {
    this.model = model;

    return this;
  }

  /**
   * Backwards compatibility
   * @param query
   * @param params
   */
  async cypher(query: string, params: IGenericObject) {
    return this.neo.read(query, params);
  }

  /**
   *
   * @param model
   */
  async getLastUniqueNumericId(model: string): Promise<number> {
    const query = `MATCH (n:UniqueIdCounter {model: $model}) RETURN n.count as counter`;
    const countRes = await this.neo.read(query, { model });

    const res = countRes.records;

    return res.length > 0 ? res[0].get('counter') : 0;
  }

  async getCurrentState(
    filter: IGenericObject,
    relationships: IGenericObject<INeo4jModelRelationshipConfig>,
    findFunction: Function,
  ) {
    const relationshipsToQuery: string[] = [];
    for (let key in relationships) {
      relationshipsToQuery.push(key);
    }

    return await findFunction(filter, relationshipsToQuery);
  }

  createPaginationObject(
    data: IGenericObject[],
    limit: number,
    page: number,
    pages: number,
    total: number,
    skip: number,
  ): IPagination<any> {
    return {
      data,
      limit,
      page,
      pages,
      total,
      skip,
    };
  }

  async findOne(filter: IGenericObject, rels: string[] = []): Promise<BaseModel> {
    const filterQuery = extractFiltersFromObject(filter, this.model.modelConfig.as, this.model.fields);
    let { filters, relationships } = extractQueryParamsFilters({ ...filter, ...{ with: rels } }, this.model);
    let { returnVars, matches } = setupRelationShipsQuery(this.model, filter, relationships, filters);

    const query = `MATCH (${this.model.modelConfig.select}) where ${filterQuery}
    WITH *
    ${matches.join('\n')}
    RETURN ${returnVars.join(',')}
    `;

    this.logger(query);
    let records = await this.neo.readWithCleanUp(query, {});

    let result = this.neo.mergeRelationshipsToParent(records[0], this.model);

    if (!result || result.length === 0) {
      throw new RecordNotFoundException(`Record Not Found`);
    }

    result = await modelPostProcessing(result, this.model);

    return result;
  }

  async find(params: IGenericObject = {}, rels: string[] = []): Promise<IPagination<BaseModel>> {
    const model = this.model;
    const modelConfig = model.modelConfig;
    const modelAlias = modelConfig.as;

    let { filters, way, limit, page, relationships, where } = extractQueryParamsFilters(
      { ...params, ...{ with: rels } },
      model,
      model.itemSelector,
    );

    const whereQuery = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
    let { returnVars, matches, returnAliases, orderBy } = setupRelationShipsQuery(
      model,
      params,
      relationships,
      filters,
    );

    const countQuery = `MATCH (${modelConfig.select}) ${whereQuery}
                WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN count(DISTINCT ${modelConfig.as}) as total`;
    // console.log('----------------\n',countQuery,'\n----------');
    this.logger(countQuery);

    const countRes = await this.neo.readWithCleanUp(countQuery, {});
    const total = countRes[0].total;
    const pages = Math.ceil(total / limit);
    const skip = limit * (page - 1);

    const query = `MATCH (${modelConfig.select}) ${whereQuery}
        WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN ${returnVars.join(',')} ORDER BY ${orderBy} ${way}  SKIP ${skip} LIMIT ${limit}`;
    // console.log('----------------\n',query,'\n----------');
    this.logger(query);

    const records = await this.neo.readWithCleanUp(query, {});

    /*    const data = res.records.map(item => {
          const record = item.get(modelAlias).properties;

          returnAliases.forEach(variable => {
            if (variable === modelAlias) {
              return;
            }

            const tmp = item.get(variable);
            if (!tmp) {
              return;
            }

            // collection

            if (Array.isArray(tmp)) {
              record[variable] = tmp
                .filter(item => {
                  if (item.properties) {return true;}
                  // In case we have added the relationship data along with the model
                  return item.model && item.relationship;
                })
                .map(item => {
                  if (item.properties) {
                    return item.properties;
                  }
                  const ret: IGenericObject = {};
                  // Assume nested object
                  Object.keys(item).forEach(key => {
                    if (item[key]) {
                      ret[key] = item[key].properties;
                    }
                  });

                  return ret;
                });
              return;
            }

            record[variable] = (tmp.low) ? tmp.low : tmp.properties;
          });
        });*/

    /*    return {
          data,
          limit,
          page,
          pages,
          total
        };*/

    let results = this.neo.extractResultsFromArray(records, this.model);

    results = await modelsPostProcessing(results, this.model);
    return this.createPaginationObject(results, limit, page, pages, total, skip);
  }

  async store(record: IGenericObject, userId?: string): Promise<any> {
    const uuid = v4();
    const query = `CREATE (${this.model.modelConfig.select} {tempUuid: $uuid, createdAt: datetime()})`;

    try {
      await this.neo.write(query, { uuid });
    } catch (e) {
      this.logger(e);
      throw new RecordStoreFailedException(e);
    }

    const withUserIdQuery = userId
      ? `MATCH (u:User {uuid:'${userId}'}) CREATE (u)-[r:HAS_CREATED {createdAt: datetime()}]->(${this.model.modelConfig.as})`
      : '';
    const tempUserQuery = `MATCH (${this.model.modelConfig.select} {tempUuid:$tempUuid})
            ${withUserIdQuery} 
        return ${this.model.modelConfig.as}.uuid as uuid`;

    const res = await this.neo.write(tempUserQuery, {
      tempUuid: uuid,
    });

    const newUuid = res.records[0].get('uuid');
    record.tempUuid = uuid;
    record.uuid = newUuid;
    this.eventEmitter.emit('ChangeLog.add', {
      model: this.model.modelName,
      uuid,
      action: 'added',
      obj: null,
      userId,
    });
    let ret;

    try {
      ret = await this.update(newUuid, record, userId);
    } catch (e) {
      console.log('Query Error 501', e);
    }

    if (this.constructor['createdEventName']) {
      this.eventEmitter.emit(this.constructor['createdEventName'], ret);
    }

    return ret;
  }

  async update(uuid: string, record: IGenericObject, userId?: string): Promise<any> {
    let firstTimeQuery = '';
    let addressStr = '';

    const fields = this.model.fields;
    let toUpdateQuery = postedDataToUpdatesQuery(fields, record, this.model.modelConfig.as);

    if (record.tempUuid) {
      firstTimeQuery = `,${this.model.modelConfig.as}.tempUuid = null`;
    }

    let translatableFieldsQuery = '';
    /*
        // This needs to be converted to flat fields like field_en
        // const translatableFieldsQuery = postedDataToTranslatableUpdatesQuery(fields, business, IBusinessModel);

        // Need to check if this model requires location services. Otherwise extract it to the child class as a sond operation
    /*    const locationService = new LocationsService();
        const addressObj = await locationService.createStringFromModel(record);

        if (Object.keys(addressObj).length > 0) {
          const addressParts = Object.keys(addressObj).map(k => `${IBusinessModel.modelConfig.as}.${k} = '${addressObj[k].replace(/'/g,`\\'`)}'`);
          addressStr = addressParts.join(', ');
          toUpdateQuery += `,${addressStr}`;
        }

        */

    const query = `MATCH (${this.model.modelConfig.select} {uuid:$uuid})
        SET ${toUpdateQuery}
        ${firstTimeQuery}
        WITH ${this.model.modelConfig.as}
        ${translatableFieldsQuery}
        RETURN *;
        `;

    let processedRecord = {};

    for (const key in record) {
      const value = record[key];

      const field = this.model.fields.find((field) => field.varName === key);
      if (field && field.type === 'nested') {
        flattenObj(processedRecord, key, value);
      } else if (field && field.type === 'json') {
        processedRecord[key] = JSON.stringify(value);
      } else {
        processedRecord[key] = value;
      }
    }

    const res = await this.neo.writeWithCleanUp(query, {
      ...processedRecord,
      ...{ uuid },
    });

    if (userId) {
      const editorQuery = `MATCH (u:User {uuid:'${userId}'})
            MATCH (${this.model.modelConfig.select} {uuid: '${uuid}'})
            MERGE (u)-[r:HAS_EDITED]->(${this.model.modelConfig.as})
                ON CREATE SET r.createdAt = datetime(), r.updatedAt = datetime()
                ON MATCH SET r.updatedAt = datetime()
                RETURN *
            `;

      await this.neo.write(editorQuery, {});
    }

    if (this.constructor['updatedEventName']) {
      this.eventEmitter.emit(this.constructor['updatedEventName'], res);
    }

    let result = this.neo.mergeRelationshipsToParent(res[0], this.model);

    return result;
  }

  async delete(uuid: string, userId?: string) {
    let authorized = true;
    const modelDeleteRule = this.model.modelConfig.deleteRules;

    if (modelDeleteRule) {
      const mustDeleteRules = modelDeleteRule.must;

      if (mustDeleteRules && mustDeleteRules.length) {
        const authorizeQuery = `MATCH (u: User {uuid: '${userId}' })-[:HAS_ROLE]->(r: Role) RETURN r`;

        let roles = await this.neo.readWithCleanUp(authorizeQuery);
        const maxLevel = Math.max(...roles.map((role) => role.r.level));

        for (let i = 0; i < mustDeleteRules.length; i++) {
          const rule = mustDeleteRules[i];

          if (rule.type === 'role' && maxLevel < rule.value) {
            authorized = false;
          }
        }
      }
    }

    if (!authorized) {
      throw new Error('No permission');
    }

    const query = `MATCH (${this.model.modelConfig.select} {uuid: $uuid}) DETACH DELETE ${this.model.modelConfig.as} RETURN *`;
    try {
      await this.neo.write(query, { uuid });
    } catch (e) {
      throw new RecordDeleteFailedException(`Could not delete ${this.model.modelName} ${uuid}`);
    }

    if (this.constructor['deletedEventName']) {
      this.eventEmitter.emit(this.constructor['deletedEventName'], uuid);
    }

    return { success: true };
  }

  async deleteMany(uuids: string[]) {
    const query = `MATCH (${this.model.modelConfig.select}) WHERE ${this.model.modelConfig.as}.uuid IN $uuids DETACH DELETE ${this.model.modelConfig.as} RETURN *`;
    try {
      await this.neo.write(query, { uuids });
    } catch (e) {
      throw new RecordDeleteFailedException(`Could not delete ${this.model.modelName} all from ${uuids}`);
    }

    return { success: true };
  }

  async deleteExcept(exceptionUuids: string[]) {
    const query = `MATCH (${this.model.modelConfig.select}) WHERE NOT ${this.model.modelConfig.as}.uuid IN $exceptionUuids DETACH DELETE ${this.model.modelConfig.as} RETURN *`;
    try {
      await this.neo.write(query, { exceptionUuids });
    } catch (e) {
      throw new RecordDeleteFailedException(
        `Could not delete ${this.model.modelName} all exceptions from ${exceptionUuids}`,
      );
    }

    return { success: true };
  }

  async attachToModelById(
    sourceId: string,
    destinationId: string,
    relationshipName: string,
    relationshipProps?: IGenericObject,
  ) {
    const relationship = this.model.modelConfig.relationships[relationshipName];

    const createSetRelationship = relationshipProps
      ? ', '.concat(
          Object.keys(relationshipProps)
            .map((relProp) => ` r.${relProp} = ${relationshipProps[relProp]},`)
            .join()
            .slice(0, -1),
        )
      : '';

    const query = `
    MATCH (n1 { uuid:'${sourceId}'})
    MATCH (n2 { uuid:'${destinationId}'})
    MERGE (n1)${relationship.type === 'normal' ? '-' : '<-'}[r:${relationship.rel}]${
      relationship.type === 'normal' ? '->' : '-'
    }(n2)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime() ${createSetRelationship}
    ON MATCH SET r.updatedAt = datetime()
    RETURN *;
    `;

    try {
      const res = await this.neo.write(query, {});
      if (!res?.records[0]) {
        return { success: false };
      }
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }

    return { success: true };
  }

  async attachToModel(
    sourceFilter: IGenericObject,
    destinationFilter: IGenericObject,
    relationshipName: string,
    relationshipProps?: IGenericObject,
  ) {
    const sourceFilterQuery = extractSingleFilterFromObject(sourceFilter);
    const destinationFilterQuery = extractSingleFilterFromObject(destinationFilter);
    const relationship = this.model.modelConfig.relationships[relationshipName];

    const createSetRelationship = relationshipProps
      ? ', '.concat(
          Object.keys(relationshipProps)
            .map((relProp) => ` r.${relProp} = ${relationshipProps[relProp]},`)
            .join()
            .slice(0, -1),
        )
      : '';

    const query = `
    MATCH (n1 {${sourceFilterQuery.key}:'${sourceFilterQuery.value}'})
    MATCH (n2 {${destinationFilterQuery.key}:'${destinationFilterQuery.value}'})
    MERGE (n1)${relationship.type === 'normal' ? '-' : '<-'}[r:${relationship.rel}]${
      relationship.type === 'normal' ? '->' : '-'
    }(n2)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime() ${createSetRelationship}
    ON MATCH SET r.updatedAt = datetime()
    RETURN *;
    `;

    try {
      const res = await this.neo.write(query, {});
      if (!res?.records[0]) {
        return { success: false };
      }
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }

    return { success: true };
  }

  async attachModelToAnotherModel(
    sourceModel: typeof BaseModel,
    sourceFilter: IGenericObject,
    destinationFilter: IGenericObject,
    relationshipName: string,
    relationshipProps?: IGenericObject,
  ) {
    const sourceFilterQuery = extractSingleFilterFromObject(sourceFilter);
    const destinationFilterQuery = extractSingleFilterFromObject(destinationFilter);
    const relationship = sourceModel.modelConfig.relationships[relationshipName];

    const createSetRelationship = relationshipProps
      ? ', '.concat(
          Object.keys(relationshipProps)
            .map((relProp) => ` r.${relProp} = ${relationshipProps[relProp]},`)
            .join()
            .slice(0, -1),
        )
      : '';

    const query = `
    MATCH (n1 {${sourceFilterQuery.key}:'${sourceFilterQuery.value}'})
    MATCH (n2 {${destinationFilterQuery.key}:'${destinationFilterQuery.value}'})
    MERGE (n1)${relationship.type === 'normal' ? '-' : '<-'}[r:${relationship.rel}]${
      relationship.type === 'normal' ? '->' : '-'
    }(n2)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime() ${createSetRelationship}
    ON MATCH SET r.updatedAt = datetime()
    RETURN *;
    `;

    try {
      const res = await this.neo.write(query, {});
      if (!res?.records[0]) {
        return { success: false };
      }
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }

    return { success: true };
  }

  async setRelationshipsByIds(
    sourceId: string,
    destinationIds: String,
    relationshipName: string,
    relationshipProps?: IGenericObject,
  ) {
    const relationship = this.model.modelConfig.relationships[relationshipName];

    const createSetRelationship = relationshipProps
      ? ', '.concat(
          Object.keys(relationshipProps)
            .map((relProp) => ` r.${relProp} = ${relationshipProps[relProp]},`)
            .join()
            .slice(0, -1),
        )
      : '';

    const relationshipStructure = (relSelector) => `
    ${relationship.type === 'normal' ? '-' : '<-'}[${relSelector}:${relationship.rel}]${
      relationship.type === 'normal' ? '->' : '-'
    }
        `;

    const query = `
    MATCH (source { uuid: $sourceId })
    OPTIONAL MATCH (source)${relationshipStructure('r')}(deleteDestination: ${relationship.model})
    WHERE NOT deleteDestination.uuid IN $destinationIds
    DELETE r

    WITH source, $destinationIds AS ids
    UNWIND ids AS id
    MATCH (destination: ${relationship.model} { uuid: id })
    MERGE (source)${relationshipStructure('newRel')}(destination)

    ON CREATE SET newRel.updatedAt = datetime(), newRel.createdAt = datetime() ${createSetRelationship}
    ON MATCH SET newRel.updatedAt = datetime()
RETURN *;
`;

    try {
      const res = await this.neo.write(query, {
        sourceId,
        destinationIds,
      });

      return res.records.map((record) => record.get('id'));
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }
  }

  async detachOneModelFromAnother(
    sourceModelName: string,
    sourceFilter: IBaseFilter,
    destinationModelName: string,
    destinationFilter: IBaseFilter,
    relationshipName: string,
  ) {
    const sourceFilterQuery = extractSingleFilterFromObject(sourceFilter);
    const destinationFilterQuery = extractSingleFilterFromObject(destinationFilter);

    const query = `
MATCH(n1: ${sourceModelName} { ${sourceFilterQuery.key}: '${sourceFilterQuery.value}'}) - [r: ${relationshipName}] - (n2:${destinationModelName} {${destinationFilterQuery.key}: '${destinationFilterQuery.value}' })
    DELETE r RETURN r;
`;

    try {
      const res = await this.neo.write(query);

      return { deletedCount: res.records.length };
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }
  }
}
