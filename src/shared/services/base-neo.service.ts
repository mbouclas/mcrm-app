import {  Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Neo4jService } from "~root/neo4j/neo4j.service";
import { IGenericObject, IPagination } from "~models/general";
import { BaseModel, INeo4jModel, INeo4jModelRelationshipConfig } from "~models/base.model";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SharedModule } from "~shared/shared.module";
import { extractFiltersFromObject, extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import {
  extractQueryParamsFilters,
  modelPostProcessing, modelsPostProcessing,
  setupRelationShipsQuery
} from "~helpers/extractQueryParamsFilters";
import { RecordNotFoundException } from "~shared/exceptions/record-not-found.exception";
import { v4 } from "uuid";
import { RecordStoreFailedException } from "~shared/exceptions/record-store-failed.exception";
import { postedDataToUpdatesQuery } from "~helpers/postedDataToUpdatesQuery";
import { RecordDeleteFailedException } from "~shared/exceptions/record-delete-failed.exception";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";
const debug = require('debug')('mcms:neo:query');

@McmsDi({
  id: 'BaseNeoService',
  type: 'service'
})
@Injectable()
export class BaseNeoService  {
  neo: Neo4jService;
  protected logQuery: debug.IDebugger = debug("mcms:neo:query");
  logger = debug;
  protected eventEmitter: EventEmitter2;
  protected model: typeof BaseModel;


  constructor(

  ) {
      this.neo = new Neo4jService();
      this.eventEmitter = SharedModule.eventEmitter;
  }

  /**
   * Backwards compatibility
   * @param query
   * @param params
   */
  async cypher(query: string, params: IGenericObject) {
    return this.neo.read(query, params)
  }

  /**
   *
   * @param model
   */
  async getLastUniqueNumericId(model: string): Promise<number> {
    const query = `MATCH (n:UniqueIdCounter {model: $model}) RETURN n.count as counter`;
    const countRes = await this.neo.read(query, {model});

    const res = countRes.records;

    return  (res.length > 0) ? res[0].get('counter') : 0;
  }

  async getCurrentState(filter: IGenericObject, relationships: IGenericObject<INeo4jModelRelationshipConfig>, findFunction: Function) {
    const relationshipsToQuery: string[] = [];
    for (let key in relationships) {
      relationshipsToQuery.push(key);
    }

    return await findFunction(filter, relationshipsToQuery);
  }

  createPaginationObject(data: IGenericObject[], limit: number, page: number, pages: number, total: number, skip: number ): IPagination<any> {
    return {
      data,
      limit,
      page,
      pages,
      total,
      skip,
    }
  }

  async findOne(filter: IGenericObject, rels: string[] = []): Promise<BaseModel> {
    const filterQuery = extractFiltersFromObject(filter, this.model.modelConfig.as, this.model.fields);
    let {filters,relationships} = extractQueryParamsFilters({ ...filter, ...{with: rels} }, this.model);
    let {returnVars, matches} = setupRelationShipsQuery(this.model, filter, relationships, filters);

    const query = `MATCH (${this.model.modelConfig.select}) where ${filterQuery}
    WITH *
    ${matches.join('\n')}
    RETURN ${returnVars.join(',')}
    `;

    this.logger(query);
    let result = await this.neo.readWithCleanUp(query, {});

    if (relationships && relationships.length > 0) {
      result = this.neo.mergeRelationshipsToParent(result[0], this.model.modelConfig.as);
    }

    if (!result || result.length === 0) {
      throw new RecordNotFoundException(`Record Not Found`);
    }



    let record = Array.isArray(result) ? result[0] : result;
    record = modelPostProcessing(record, this.model);

    return record;

  }

  async find(params: IGenericObject = {}, rels: string[] = []): Promise<IPagination<BaseModel>> {
    const model = this.model;
    const modelConfig = model.modelConfig;
    const modelAlias = modelConfig.as;

    let {filters, way, limit, page, relationships, where} = extractQueryParamsFilters({ ...params, ...{with: rels} }, model, model.itemSelector);

    const whereQuery = (where.length > 0) ? ` WHERE ${where.join(' AND ')}` : '';
    let {returnVars, matches, returnAliases, orderBy} = setupRelationShipsQuery(model, params, relationships, filters);

    const countQuery = `MATCH (${modelConfig.select}) ${whereQuery}
                WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN count(DISTINCT ${modelConfig.as}) as total`;
    // console.log('----------------\n',countQuery,'\n----------');
    this.logger(countQuery);

    const countRes = await this.neo.readWithCleanUp(countQuery, {});
    const total = countRes[0];
    const pages = Math.ceil(total / limit);
    const skip = limit * (page - 1);

    const query = `MATCH (${modelConfig.select}) ${whereQuery}
        WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN ${returnVars.join(',')} ORDER BY ${orderBy} ${way}  SKIP ${skip} LIMIT ${limit}`;
    // console.log('----------------\n',query,'\n----------');
    this.logger(query);

    const res = await this.neo.readWithCleanUp(query, {});

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

    let results = this.neo.extractResultsFromArray(res, this.model.modelConfig.as);

    // results = modelsPostProcessing(results, this.model);
    return this.createPaginationObject(results, limit, page, pages, total, skip);
  }

  async store(record: IGenericObject, userId?: string) {
    const uuid = v4();
    const query = `CREATE (${this.model.modelConfig.select} {tempUuid: $uuid, createdAt: datetime()})`;

    try {
      await this.neo.write(query, {uuid});
    }
    catch (e) {
      this.logger(e)
      throw new RecordStoreFailedException(e);
    }

    const withUserIdQuery = (userId) ? `MATCH (${this.model.modelConfig.select} {uuid:'${userId}'}) CREATE (u)-[r:HAS_CREATED {createdAt: datetime()}]->(${this.model.modelConfig.as})` : '';
    const tempUserQuery = `MATCH (${this.model.modelConfig.select} {tempUuid:$tempUuid})
            ${withUserIdQuery} 
        return ${this.model.modelConfig.as}.uuid as uuid`;


    const res = await this.neo.write(tempUserQuery, {
      tempUuid: uuid
    });

    const newUuid = res.records[0].get('uuid');
    record.tempUuid = uuid;
    record.uuid = newUuid;
    this.eventEmitter.emit('ChangeLog.add', {model: this.model.modelName, uuid, action: 'added',obj: null, userId});
    const ret = await this.update(newUuid, record, userId);

    if (this.constructor['createdEventName']) {
      this.eventEmitter.emit(this.constructor['createdEventName'], ret);
    }


    return ret;
  }

  async update(uuid: string, record: IGenericObject, userId?: string) {
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

    const res = await this.neo.write(query, {
      ...record, ...{uuid}
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


  }

  async delete(uuid: string, userId?: string) {
    const query = `MATCH (${this.model.modelConfig.select} {uuid: $uuid}) DETACH DELETE ${this.model.modelConfig.as} RETURN *`;
    try {
      await this.neo.write(query, {uuid});
    }
    catch (e) {
      throw new RecordDeleteFailedException(`Could not delete ${this.model.modelName} ${uuid}`);
    }



    if (this.constructor['deletedEventName']) {
      this.eventEmitter.emit(this.constructor['deletedEventName'], uuid);
    }

    return {success: true};
  }

  async attachModelToAnotherModel(sourceModel: typeof BaseModel, sourceFilter: IGenericObject, destinationModel: typeof BaseModel, destinationFilter: IGenericObject, relationshipName: string) {
    const sourceFilterQuery = extractSingleFilterFromObject(sourceFilter);
    const destinationFilterQuery = extractSingleFilterFromObject(sourceFilter);
    const relationship = sourceModel.modelConfig.relationships[relationshipName];

    const query = `
    MATCH (${sourceModel.modelConfig.select} {${sourceFilterQuery.key}:'${sourceFilterQuery.value}')
    MATCH (${destinationModel.modelConfig.select} {${destinationFilterQuery.key}:'${destinationFilterQuery.value}')
    MERGE (${sourceModel.modelConfig.as})${relationship.type === 'normal' ? '-' : '<-'}[r:${relationshipName}]${relationship.type === 'normal' ? '->' : '-'}(${destinationModel.modelConfig.as})
    ON CREATE SET t.updatedAt = datetime(), t.createdAt = datetime()
    ON MATCH SET t.updatedAt = datetime()
    RETURN *;
    `;

    try {
      this.neo.write(query, {})
    }
    catch (e) {
      throw new RecordUpdateFailedException(e);
    }
  }

}
