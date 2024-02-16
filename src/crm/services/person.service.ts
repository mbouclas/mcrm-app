import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IGenericObject, IPagination } from "~models/general";
import { store } from "~root/state";
import { BaseModel } from "~models/base.model";
import { PersonModel } from "~crm/models/person.model";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { extractFiltersFromObject } from "~helpers/extractFiltersFromObject";
import { extractQueryParamsFilters, setupRelationShipsQuery } from "~helpers/extractQueryParamsFilters";
import { RecordNotFoundException } from "~shared/exceptions/record-not-found.exception";

export class PersonModelDto {

}

@McmsDi({
  id: 'PersonService',
  type: 'service'
})
@Injectable()
export class PersonService extends BaseNeoService {
  protected relationships = [];
  protected moduleName = 'crm';
  private modelName = 'Person';


  constructor() {
    super();
    this.model = store.getState().models.Person;
  }

  async findOne(filter: IGenericObject, rels: string[] = []): Promise<PersonModel> {
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



    return result;
  }

  async find<PersonModel>(params: IGenericObject = {}): Promise<IPagination<PersonModel>> {
        const model = this.model;
    const modelConfig = model.modelConfig;
    const modelAlias = modelConfig.as;
    let {filters, way, limit, page, relationships, where} = extractQueryParamsFilters(params, model, model?.itemSelector);
    const whereQuery = (where.length > 0) ? ` WHERE ${where.join(' AND ')}` : '';
    let {returnVars, matches, returnAliases, orderBy} = setupRelationShipsQuery(model, params, relationships, filters);
    const countQuery = `MATCH (${modelConfig.select}) ${whereQuery}
                WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN count(DISTINCT ${modelConfig.as}) as total`;

    this.logger(countQuery);

    const countRes = await this.neo.readWithCleanUp(countQuery, {});
    const total = countRes[0].total;
    const pages = Math.ceil(total / limit);
    const skip = limit * (page - 1);

    const query = `MATCH (${modelConfig.select}) ${whereQuery}
        WITH ${modelAlias}
        ${matches.join('\n')}
        RETURN ${returnVars.join(',')} ORDER BY ${orderBy} ${way}  SKIP ${skip} LIMIT ${limit}`;

    this.logger('-----------');
    this.logger(query);
    const res = await this.neo.readWithCleanUp(query, {});
    const results = this.neo.extractResultsFromArray(res, this.model.modelConfig.as);

    return this.createPaginationObject(results, limit, page, pages, total, skip);
  }

  async store(record: PersonModelDto, userId?: string) {

  }

  async update(uuid: string, record: PersonModelDto, userId?: string) {

  }

  async delete(uuid: string, userId?: string) {
    return await super.delete(uuid, userId);
  }
}
