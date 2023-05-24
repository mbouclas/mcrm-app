import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Client } from "@elastic/elasticsearch";
import { store } from "../state";
import {
  IElasticSearchAggregation, IElasticSearchAggregationBucket, IElasticSearchAggregationBucketResult,
  IElasticSearchAggregationResult,
  IElasticSearchFilter,
  IElasticSearchFilterMap,
  IElasticSearchGeoFilter, IElasticSearchHit, IElasticSearchOptions, IElasticSearchRangeOption, IElasticSearchResults,
  IElasticSearchTextFilter
} from "./elastic-search.models";
import { IGenericObject } from "~models/general";
import {findIndex} from 'lodash';
import { ELASTIC_SEARCH_CONFIG, ELASTIC_SEARCH_DRIVER } from "./elastic-search.module";
import { ModuleRef } from "@nestjs/core";
import { highlighter, qsMatcher } from "~helpers/highlighter";
import { IProductModelEs } from "~catalogue/export/sync-elastic-search.service";

export interface ISearchArgs {
  page?: number;
  limit?: number
  queryParameters?: IGenericObject;
  q?: string;
}

interface IElasticSearchQueryAggregation extends IElasticSearchAggregation{
}

@Injectable()
export class ElasticSearchService implements OnApplicationShutdown {
  protected lang = 'en';
  protected index: string;
  protected defaultAggregationSize = 30;
  aggregationFields: IElasticSearchFilterMap[] = [
    {
      name: 'price',
      type: "range",
      isKeyword: false,
      size: this.defaultAggregationSize,
      field: 'price',
      ranges: [
        { to: 60000.0 },
        { from: 60000.0, to: 100000.0 },
        { from: 100000.0, to: 500000.0 },
        { from: 500000.0, to: 1000000.0 },
        { from: 1000000.0 }
      ],
      boost: 2,
    },

  ];

  protected extraFilters: string[] = [
    'categories_uuid',
  ];
  protected autoCompleteFields: string[] = [
    'title',
    'id',
    'description',
    'sku'
  ];
  protected appliedFilters: IElasticSearchFilter<IElasticSearchGeoFilter|IElasticSearchTextFilter>[] = [];
  protected queries: IGenericObject[] = [];
  protected searchWithAggregations = true;
  public client: Client;
  protected defaultIndex = process.env.ELASTICSEARCH_INDEX;
  protected applyQueryStringFilterOnAggregations;
  protected filters: IGenericObject[] = [];
  protected returnRawAggregations = false;
  protected debug = false;
  protected defaultSort = {updated_at: 'desc'};
  protected sort: IGenericObject[] = [this.defaultSort];
  private aggregations: IElasticSearchQueryAggregation[] = [];

  constructor(
    private moduleRef: ModuleRef
    // @Inject(ELASTIC_SEARCH_DRIVER) private readonly client: Client
  ) {
    this.client = this.moduleRef.get(ELASTIC_SEARCH_DRIVER);
    this.lang = store.getState().defaultLanguageCode;

/*    if (opts.aggregationFields) {
      this.aggregationFields = opts.aggregationFields;
    }

    if (opts.lang) {
      this.lang = opts.lang;
    }*/

  }

  async indexExists(index: string): Promise<boolean> {
    return  await this.client.indices.exists({index});

  }

  public setIndex(index: string) {
    this.index = index;

    return this;
  }

  public getIndex() {
    return this.index;
  }

  public setDebugMode(mode: boolean) {
    this.debug = mode;

    return this;
  }

  public setAutoCompleteFields(fields: string[]) {
    this.autoCompleteFields = fields;

    return this;
  }

  public setAggregationFields(fields: IElasticSearchFilterMap[]) {
    this.aggregationFields = fields;


    return this;
  }

  public getAggregationFields() {
    return this.aggregationFields;
  }

  /**
   * Due to the naming of this method can be confusing, reverse the result
   * @param mode
   */
  public setAggregationProcessing(mode: boolean) {
    this.returnRawAggregations = !mode;

    return this;
  }

  public addSort(key: string, way: 'asc'|'desc') {
    const sort = {};
    sort[key] = way;
    this.sort = [sort];

    return this;
  }

  getDriver(): Client {
    return this.client;
  }

  setLang(lang: string) {
    this.lang = lang;

    return this;
  }

  resetIndex() {
    this.index = this.defaultIndex;
  }

  async onApplicationShutdown(signal?: string) {
        await this.client.close();
    }

  public async search(limit = 10, page = 1) {
    const from = limit * (page - 1);

    const body:IGenericObject = {
      sort: this.sort,
      from,
      size: limit,
      query: this.composeQuery(),
    };

    if (this.filters.length > 0 && body.query.bool) {
      body.query.bool.filter = this.filters;
    }

    if (this.searchWithAggregations) {
      body.aggs = this.composeAggregations();
    }

    if (Array.isArray(this.aggregations) && this.aggregations.length > 0) {
      if (!body.aggs) {body.aggs = {};}
      this.aggregations.forEach(agg => body.aggs = {...body.aggs, ...agg})
    }

    if (this.debug){
      console.log(JSON.stringify(body))
    }

    try {
      const res = await this.client.search({
        index: this.index,
        body,
      });

      return this.composeResult(res, limit, page, from);
    }
    catch (e) {
      if (e.meta) {
        console.log(e.meta.body.error)
      }

      console.log(e)
      return {
        total: 0,
        page,
        pages: 0,
        from,
        limit,
        data: [],
        aggregations: [],
      }
    }
  }

  public async rawQuery(query: IGenericObject, size = 10, page = 1, from = 0, sort: IGenericObject = null) {
    const body: IGenericObject = {
      from,
      size
    }

    if (sort) {
      body.sort = sort;
    }

    if (query.query) {
      body.query = query.query;
    }

    if (query.aggs) {
      body.aggs = query.aggs;
    }

    if (this.debug){
      console.log(JSON.stringify(body))
    }

    try {
      const res = await this.client.search({
        index: this.index,
        body,
      });

      return this.composeResult(res, size, page, from);
    }
    catch (e) {
      console.log('Error executing raw query', e);
    }
  }

  public removeAggregationsFromQuery() {
    this.searchWithAggregations = false;

    return this;
  }

  public setSearchWithAggregations(mode: boolean) {
    this.searchWithAggregations = mode;

    return this;
  }

  public addAutoCompleteQuery(q: string, type: 'should'|'must' = 'should', returnQueries = false) {

    const queries: any[] = this.aggregationFields
      .filter(field => Array.isArray(field.inAutoComplete))
      .map(field => {
        return {
          nested: {
            path: field.name,
            query: {
              multi_match: {
                query: q,
                type: "best_fields",
                operator: "and",
                "fields": (field.inAutoComplete) ? field.inAutoComplete.map(f => `${field.name}.${f}`) : ['*']
              }
            }
          }
        }
      });

    queries.push({
      "multi_match": {
        "fields": this.autoCompleteFields,
        "type": "best_fields",
        "operator": "and",
        "query": q
      }
    });

    if (returnQueries) {
      return queries;
    }

    type === 'must' ? this.addMustQuery(queries) : this.addShouldQuery(queries);

    return this;
  }

  public addMustQuery(queries: IGenericObject[]) {
    this.queries.push({
      type: 'must',
      queries
    });

    return this;
  }

  public addShouldQuery(queries: IGenericObject[]) {
    this.queries.push({
      type: 'should',
      queries
    });

    return this;
  }

  public addFilter(filter: IElasticSearchFilter<IElasticSearchGeoFilter|IElasticSearchTextFilter>) {
    this.appliedFilters.push(filter);
    return this;
  }

  private composeFilters() {
    return this.appliedFilters.map(f => {
      if (f.nested) {
        return f;
      }

      if (f.type === 'text') {
        const term: any = {};
        // @ts-ignore
        term[f.filter.key] = f.filter.value;
        return {term};
      }

      if (f.type === 'geo') {
        const term: IElasticSearchGeoFilter = {} as IElasticSearchGeoFilter;
        const filter = f.filter as IElasticSearchGeoFilter;
        // @ts-ignore
        term[f.filter.key] = {
          distance: filter.distance,
          location: filter.location,
        };

        return term;
      }

    })
  }

  private composeQuery() {
    const query: {bool?: {filter?: IGenericObject; must?: IGenericObject[], should?: IGenericObject[]} } = {
      bool: {}
    };

    if (this.appliedFilters.length > 0) {
      query.bool.filter = this.composeFilters();
    }

    if (this.queries.length > 0) {

      this.queries.forEach(q => {

        if (q.type === 'should') {
          if (!Array.isArray(query.bool.should)) {query.bool.should = [];}
          query.bool.should = query.bool.should.concat(q.queries);
          return;
        }


        if (!Array.isArray(query.bool.must)) {query.bool.must = [];}
        // @ts-ignore
        q.queries.forEach((item: IGenericObject) => query.bool.must.push(item));
      });

    }

    return query;
  }

  private composeAggregations() {
    const aggs: IElasticSearchAggregation = {};
    for (let i = 0; this.aggregationFields.length > i; i++) {
      const f = this.aggregationFields[i];

      if (f.type === 'simple') {
        aggs[`${f.name}`] = this.simpleAggregation(f);
      } else if (f.type === 'range') {
        aggs[`${f.name}`] = this.rangedAggregation(f);
      } else {
        aggs[`${f.alias || f.name}`] =this.nestedAggregation(f);
      }

      // aggs[`${f.name}`] = (f.type === 'simple') ? this.simpleAggregation(f) : this.nestedAggregation(f);
    }

    return aggs;
  }

  setAggregationSizeForAll(size: number) {
    this.aggregationFields.forEach(field => field.size = size);
    return this;
  }
  setAggregationSizeForField(fieldName: string, size: number) {
    const field = this.aggregationFields.find(f => f.name === fieldName);
    field.size = size;

    return this;
  }

  rangedAggregation(field: IElasticSearchFilterMap) {
    return {
      range: {
        field: field.name,
        ranges: field.ranges,
      }
    };
  }


  simpleAggregation(field: IElasticSearchFilterMap) {
    return {
      terms: {
        field: (field.isKeyword) ? `${field.name}.keyword` : field.name,
        size: field.size,
      }
    }
  }

  nestedAggregation(field: IElasticSearchFilterMap) {
    const q: any = {
      "nested": {
        "path": field.name
      },
      aggs: {}
    };

    field.buckets?.forEach(bucket => {
      const parts = bucket.split('.');
      let fieldName = (field.multilingual && bucket !== 'slug') ? `${parts[0]}_${this.lang}` : parts[0];

      q.aggs[parts[0]] = {
        terms: {
          field: (parts.length > 1) ? `${field.name}.${fieldName}.${parts[1]}` : `${field.name}.${fieldName}`,
          size: field.size,
        }
      }
    });

    return q;
  }

  private composeResult(body: Record<string, any>, limit: number, page: number, from: number): IElasticSearchResults<IProductModelEs> {
    let aggregations: IElasticSearchAggregationBucketResult[] = [];
    let total = (body.hits && body.hits.total && body.hits.total.value) ? body.hits.total.value : 0;
    let data: IProductModelEs[] = [];

    if (body.aggregations && this.searchWithAggregations) {
      aggregations = (this.returnRawAggregations) ? body.aggregations : this.extractAggregationResults(body.aggregations);
    } else if (body.aggregations && !this.searchWithAggregations) {
      aggregations = body.aggregations;
    }

    if (body.hits && body.hits.hits) {
      data = this.extractQueryResults(body.hits.hits);
    }
    const pages = Math.ceil(total / limit);

    return {
      aggregations,
      data,
      total,
      from,
      limit: typeof limit !== 'number' ? parseInt(limit) : limit,
      page: typeof page !== 'number' ? parseInt(page) : page,
      pages,
    };
  }

  private extractAggregationResults(aggs: IElasticSearchAggregationResult) {
    const tmp: IElasticSearchAggregationBucketResult[] = [];

    for (let idx = 0; this.aggregationFields.length > idx; idx++) {
      const field = this.aggregationFields[idx];
      const aggName = field.alias || field.name;

      if (!aggs[aggName]) {continue;}

      if (field.buckets && field.buckets.length > 0) {
        tmp.push(this.extractBucketsFromNestedAggregation(field, aggs[aggName]));
        continue;
      }

      if (field.type === 'simple' && Array.isArray(aggs[aggName].buckets)) {
        tmp.push(this.extractBucketsFromSimpleAggregation(field, aggs[aggName]));

        continue;
      }

      if (field.type === 'range') {
        this.extractBucketsFromRangeAggregation(field, aggs[aggName])
      }

      tmp.push({
        key: aggName,
        results: aggs[aggName].buckets,
      })
    }

    return tmp;
  }

  private extractQueryResults(hits: IElasticSearchHit<IProductModelEs>[]) {
    return hits.map(hit => hit._source);
  }

  resetFilters() {
    this.appliedFilters = [];
    this.queries = [];
    this.filters = [];
    this.index = this.defaultIndex;
    this.sort = [this.defaultSort];
    this.returnRawAggregations = false;
    this.setAggregationFields([]);
    this.setAutoCompleteFields([]);
    this.setSearchWithAggregations(false);
    return this;
  }

  addFilters(filters: IGenericObject) {

    for (let key in filters) {
      const parts = key.split('.');

      const aggregationFieldIdx = findIndex(this.aggregationFields, {name: parts[0]});
      if (aggregationFieldIdx === -1 && this.extraFilters.indexOf(parts[0]) === -1) {continue;}
      const field = this.aggregationFields[aggregationFieldIdx];


      const match: IGenericObject = {};
      const filterOn = (parts.length === 1 && field.key) ? `${field.name}.${field.key}` : key;
      match[filterOn] = filters[key];

      if (field.type === 'nested') {
        this.addNestedFilter(filterOn, filters[key]);
      }
      else if (field.type === 'simple') {
        this.addTermFilter(field.name, filters[key])
      }
    }

    return this;
  }

  private extractBucketsFromNestedAggregation(field: IElasticSearchFilterMap, agg: any) {
    const aggName = field.alias || field.name;
    if (!field.buckets || field.buckets.length === 0) {
      return {
        key: aggName,
        results: []
      };
    }

    const mainBucket = field.mainBucketName ? field.mainBucketName : Object.keys(agg).filter(bucket => bucket !== 'slug' && bucket !== 'doc_count')[0];
    if (!mainBucket) {
      return {
        key: aggName,
        results: []
      };
    }

    const results = agg[mainBucket].buckets.map((item: IElasticSearchAggregationBucket, idx: number) => {
      const highlighted_result = (this.applyQueryStringFilterOnAggregations && qsMatcher(item.key, this.applyQueryStringFilterOnAggregations)) ? highlighter(item.key, this.applyQueryStringFilterOnAggregations) : undefined;
      if (field.alias === 'material') {
        // console.log(item)
      }

      const res = {
        key: item.key,
        doc_count: item.doc_count,
        slug: (field.slugKey) ? agg[field.slugKey].buckets[idx].key : agg.slug.buckets[idx].key,
        highlighted_result
      };

      return res;
    });

    return {
      key: aggName,
      results
    };
  }

  filterAggregationsBasedOnQueryString(qs = null) {
    this.applyQueryStringFilterOnAggregations = qs;
    return this;
  }

  addLocationFilter(location: string, locationType: string) {
    if (locationType === 'postCode') {
      return this.addTermFilter(locationType, location);
    }

    this.addNestedFilter(locationType, location);

    return this;
  }

  addTermFilter(fieldName: string, value: string|boolean) {
    const filter: IGenericObject = {
      term: {}
    }
    filter.term[fieldName] = value;
    this.filters.push(filter);
    return this;
  }

  addNestedFilter(fieldName: string, value: string) {
    const path = fieldName.split('.');
    const filter: IGenericObject = {
      nested: {
        path: path[0],
        query: {
          match: {}
        }
      }
    };
    filter.nested.query.match[fieldName] = value;
    this.filters.push(filter);
    return this;
  }

  public addRangeQuery(key: string, values: IElasticSearchRangeOption, type: 'must'|'should' = 'must', boost = 1, fromType: 'gt'|'gte' = 'gt', toType: 'lt'|'lte' = 'lt') {
    const term = {};
    term[key] = {boost: 1};

    const query = {range: term};

    if (Array.isArray(values)) {
      values = this.extractRangeValuesFromArray(values);
    }

    if (values.from) {
      query.range[key][fromType] = values.from;
    }

    if (values.to) {
      query.range[key][toType] = values.to;
    }


    type === 'must' ? this.addMustQuery([query]) : this.addShouldQuery([query]);

    return this;
  }

  extractRangeValuesFromArray(values: string[]) {
    const ret = {
      from: 0,
      to: 0
    };
    const vals = values[0].split('-');

    return {
      from: vals[0] === '*' ? 0 : parseInt(vals[0]),
      to: vals[1] === '*' ? null : parseInt(vals[1])
    }
  }

  public formMultiMatchQuery(path: string, searchValue: string, fields: string[] = []) {
    return {
      nested: {
        path,
        query: {
          multi_match: {
            query: searchValue,
            type: 'best_fields',
            operator: 'and',
            fields
          }
        },
      }
    }
  }
  private extractBucketsFromRangeAggregation(field: IElasticSearchFilterMap, agg: any) {
    agg.buckets.forEach(bucket => {
      bucket.slug = `${bucket.from || '*'}-${bucket.to || '*'}`;
    });

    return agg;
  }

  private extractBucketsFromSimpleAggregation(field: IElasticSearchFilterMap, agg: any) {
    const aggName = field.alias || field.name;
    const results = agg.buckets.map(item => {
      const highlighted_result = (this.applyQueryStringFilterOnAggregations && qsMatcher(item.key, this.applyQueryStringFilterOnAggregations)) ? highlighter(item.key, this.applyQueryStringFilterOnAggregations) : undefined;

      return {
        key: item.key,
        doc_count: item.doc_count,
        slug: item.key,
        highlighted_result
      }
    });
    return {
      key: aggName,
      results
    }
  }

  addNestedAggregation(aggregationName: string, aggregationPath: string, aggregationBody: {name: string; field: string; size?: number; order: { [key: string]: string } }[]) {
    const agg = {};
    let aggs = {};
     aggregationBody.forEach(a => {
      const temp = {};
      const terms = {
        size: (a.size) ? a.size: 10,
        field: a.field,
        order: a.order
      };

      temp[a.name] = {
        terms
      }
      aggs = {...aggs, ...temp};
    });
    agg[aggregationName] = {
      nested: {
        path: aggregationPath,
      },
      aggs,
    }

    this.aggregations.push(agg)
    return this;
  }

  addNestedFilterArray(fieldName: string, values: string[]) {
    values.forEach(value => this.addNestedFilter(fieldName, value));

    return this;
  }

  static outputBulkResponseErrors(errors: any, body: any, items: any) {
    const erroredDocuments: any[] = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    items.forEach((action: any, i: number) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document:JSON.stringify( body[i * 2 + 1])
        })
      }
    })
    console.log(erroredDocuments)
  }
}
