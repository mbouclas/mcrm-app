import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IBaseFilter, IGenericObject } from "~models/general";
import { McmsDi, McmsDiContainer } from "~helpers/mcms-component.decorator";
import * as slugify from 'slug';
import { INeo4jModel } from "~models/base.model";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";
import { extractSingleFilterFromObject } from "~helpers/extractFiltersFromObject";
import { store } from "~root/state";

export interface ITag {
  [k: string]: any;
  name: string;
  slug: string;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

@McmsDi({
  id: 'TagService',
  type: 'service',
})
@Injectable()
export class TagService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.Tag;
  }
  onApplicationBootstrap() {

  }

/*  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new TagService();

    // const r = await s.quickAddTag('Product', 'T-Shirts');
    // const r1 = await s.getModelTags('Product');
    // console.log(r1)
    // const r = await s.getTagsByModel('Product', {slug: 'test'});
    // const r = await s.addTagToModel('Product', {slug: 'poppy'}, {slug: 'shirts'})
    // const r = await s.updateModelTags('e3b39b18-1a7a-4374-8d09-93f1fad349a1', [
    //   {slug: 'shoes', uuid: 'e0f6bf03-24ba-4255-a88b-c226c6ceb030', name: 'Shoes', createdAt: new Date(), updatedAt: new Date()}
    // ], store.getState().models['Product'].modelConfig as any);

    // console.log(r)

    // console.log(r['property'][0])
  }*/

  async getTagsByModel(model: string, modelFilter?: IBaseFilter, tagFilter?: IBaseFilter) {
    let modelQuery = '';
    let filterQuery = '';
    if (modelFilter) {
      const key = Object.keys(modelFilter)[0];
      const value = modelFilter[key];
      modelQuery = ` WHERE model.${key} =~ '${value}'`;
    }

    if (tagFilter && typeof tagFilter !== 'undefined') {
      const key = Object.keys(tagFilter)[0];
      const value = tagFilter[key];
      filterQuery = ` WHERE tag.${key}  =~ '(?i).*${value}.*'`;
    }


    const query = `MATCH (model:${model}) ${modelQuery}
        WITH model
        MATCH (model)-[:HAS_TAGS]->(tag:Tag) 
        ${filterQuery}
        return tag`;

    const result = await this.neo.readWithCleanUp(query,{});

    if (result.length === 0) {
      return [];
    }


    return result;
  }

  async getModelTags(model: string, tagFilter?: IBaseFilter) {
    let filterQuery = '';

    if (tagFilter && typeof tagFilter !== 'undefined') {
      const key = Object.keys(tagFilter)[0];
      const value = tagFilter[key];
      filterQuery = ` WHERE tag.${key}  =~ '(?i).*${value}.*'`;
    }

    const query = `MATCH (tag:Tag {model: '${model}'}) ${filterQuery}
        return tag ORDER BY tag.name ASC`;
    const result = await this.neo.readWithCleanUp(query,{});

    if (result.length === 0) {
      return [];
    }


    return result;
  }

  async addTagToModel(model: string, modelFilter: IBaseFilter, tag: IBaseFilter) {
    const filter = extractSingleFilterFromObject(modelFilter);
    const tagFilter = extractSingleFilterFromObject(tag);

    const query = `
    MATCH (model:${model} {${filter.key}:'${filter.value}'})
    MATCH (tag:Tag {${tagFilter.key}:'${tagFilter.value}'})
    MERGE (model)-[r:HAS_TAGS]->(tag)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    RETURN *;
    `;

    try {
      await this.neo.write(query, {});
    }
    catch (e) {
      console.log(e)
      throw new RecordUpdateFailedException(e);
    }

    return this;
  }

  async removeTagFromModel(model: string, modelFilter: IBaseFilter, tag: IBaseFilter) {
    const filter = extractSingleFilterFromObject(modelFilter);
    const tagFilter = extractSingleFilterFromObject(tag);

    const query = `
    MATCH (model:${model} {${filter.key}:'${filter.value}'})-[r:HAS_TAGS]->(tag:Tag {${tagFilter.key}:'${tagFilter.value}'})
    DETACH DELETE r
    RETURN *;
    `;

    try {
      await this.neo.write(query, {});
    }
    catch (e) {
      console.log(e)
      throw new RecordUpdateFailedException(e);
    }

  }

  /**
   * This is a quick create method, the user inputs a string and nothing more.
   * We need to emulate a multilingual object for this to work properly
   * @param model
   * @param name
   */
  async quickAddTag(model: string, name: string) {
    name = name.trim();
    const Model = McmsDiContainer.model('Tag');
    const slug = slugify(name, {lower: true});
    // check if it exists first
    const exists = await this.checkTag(model, name);
    if (exists) {return exists;}


    const query = `MERGE (tag:Tag {name: $simple_name, slug: '${slug}', model: '${model}'})
        ON CREATE SET  tag.createdAt = datetime()
        ON MATCH SET tag.updatedAt = datetime()

          return tag`;

    try {
      await this.neo.write(query,{
        simple_name: name,
        name: name,
      });
    }
    catch (e) {
      console.log(query)
      console.log(e)
    }

    // query again to get the uuid
    return await this.checkTag(model, name);
  }

  async checkOrAddTag(model: string, name: string) {
    const tag = await this.checkTag(model, name);
    if (tag) {return tag;}

    return await this.quickAddTag(model, name);
  }

  async checkTag(model: string, name: string) {
    const query = `MATCH (tag:Tag {name: '${name}', model:'${model}'}) 
        return tag`;
    const result = await this.neo.readWithCleanUp(query,{});

    if (result.length === 0) {
      return null;
    }

    return result;
  }

  async updateModelTags(uuid: string, tags: ITag[], modelConfig: INeo4jModel) {
    const oldTagsQuery = `MATCH (${modelConfig.select})  WHERE ${modelConfig.as}.uuid = $uuid
        WITH ${modelConfig.as}
        MATCH (${modelConfig.as})-[:${modelConfig.relationships.tag.rel}]->(${modelConfig.relationships.tag.modelAlias}:${modelConfig.relationships.tag.model})

        return ${modelConfig.relationships.tag.modelAlias}.uuid as id`;

    const oldTags = await this.neo.readWithCleanUp(oldTagsQuery,{uuid});

    const tagIdsArray = tags.map(tag => tag.uuid);
    const tagsToDelete = oldTags.filter((v: string) => !tagIdsArray.includes(v));

    const query = `UNWIND $tags as row
            MATCH (${modelConfig.select} {uuid: $uuid})
            MATCH (${modelConfig.relationships.tag.modelAlias}:${modelConfig.relationships.tag.model} {uuid: row.uuid})
            WITH *
            MERGE (${modelConfig.as})-[${modelConfig.relationships.tag.alias}:${modelConfig.relationships.tag.rel}]->(${modelConfig.relationships.tag.modelAlias})
            ON CREATE SET ${modelConfig.relationships.tag.alias}.updatedAt = datetime(), ${modelConfig.relationships.tag.alias}.createdAt = datetime()
            ON MATCH SET ${modelConfig.relationships.tag.alias}.updatedAt = datetime()
            return *;
        `;

    try {
      await this.neo.write(query,{
        uuid,
        tags
      });
    }
    catch (e) {
      throw new RecordUpdateFailedException(e.toString());
    }


    if (tagsToDelete.length === 0) {return ;}

    const toDeleteQuery = `MATCH (${modelConfig.select} {uuid: $uuid})-[r:${modelConfig.relationships.tag.rel}]->(${modelConfig.relationships.tag.modelAlias}:${modelConfig.relationships.tag.model})
        where ${modelConfig.relationships.tag.modelAlias}.uuid IN $tagsToDelete DELETE r;
        `;

    try {
      await this.neo.write(toDeleteQuery,{
        uuid,
        tagsToDelete
      });
    }
    catch (e) {
      throw new RecordUpdateFailedException(e.toString());
    }
  }

  /**
   * This method will add tags to a model in bulk. If the tag exists it will simply link to the model. If it doesn't exist it will create it and then link it
   * @param model
   * @param modelFilter
   * @param tags
   */
  async bulkAddTagsToModel(model: string, modelFilter: IGenericObject, tags: string[]) {
    const filter = extractSingleFilterFromObject(modelFilter);
    const input = tags.map(tag => {
      return {
        name: tag,
        slug: slugify(tag, {lower: true})
      }
    });

    const upsertQuery = `
    UNWIND $tags as tag
    MERGE (t:Tag {slug: tag.slug})
    ON CREATE SET t.createdAt = datetime(), t.slug = tag.slug, t.name = tag.name, t.model = $model
    ON MATCH SET t.updatedAt = datetime()
    return *;
    `;

    try {
      await this.neo.write(upsertQuery, {
        tags: input,
        model
      });
    }
    catch (e) {
      console.log(`Error executing tag upsert query`, e);
    }

    const linkQuery = `
      UNWIND $tags as tag
      MATCH (model:${model} {${filter.key}:'${filter.value}'})
      MATCH (t:Tag {slug: tag.slug})
      MERGE (model)-[r:HAS_TAGS]->(t)
      ON CREATE SET r.createdAt = datetime(), r.updatedAt = datetime()
      ON MATCH SET r.updatedAt = datetime()
    `;

    try {
      await this.neo.write(linkQuery, {
        tags: input,
      });
    }
    catch (e) {
      console.log(`Error executing tag link query`, e);
    }

    return {success: true}
  }
}
