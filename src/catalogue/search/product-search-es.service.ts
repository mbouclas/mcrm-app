import { Injectable } from '@nestjs/common';
import { ElasticSearchService, ISearchArgs } from "~es/elastic-search.service";
import { IElasticSearchAggregationBucketResult, IElasticSearchFilterMap } from "~es/elastic-search.models";

@Injectable()
export class ProductSearchEsService {
  protected defaultSort = 'updatedAt';
  protected defaultWay: 'asc'|'desc' = 'desc';
  protected allowedSortFields = [
    'updatedAt', 'price', 'title'
  ];
  protected defaultAggregationSize = 30;
  protected debugMode = false;
  protected hiddenFields = [
    'updatedAt',
  ];

  protected autoCompleteFields = [
    'title',
    'id',
    'sku',
    'description',
  ];

  protected aggregationFields: IElasticSearchFilterMap[] = [
    {
      name: 'properties',
      alias: 'material',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['materialName.keyword', 'materialValue.keyword'],
      isKeyword: true,
      size: 50,
      fixSlugs: true,
      slugKey: 'materialValue',
      mainBucketName: 'materialName'
    },
    {
      name: 'categories',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['title.keyword', 'slug'],
      isKeyword: true,
      size: 60,
    },
    {
      name: 'properties',
      alias: 'colors',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['code.keyword', 'slug'],
      isKeyword: true,
      size: 100,
      fixSlugs: true,
    },

    {
      name: 'properties',
      alias: 'size',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['value.keyword','slug'],
      isKeyword: true,
      size: 30,
      fixSlugs: true,
    },
    {
      name: 'price',
      type: "range",
      isKeyword: false,
      size: this.defaultAggregationSize,
      field: 'price',
      ranges: [
        { to: 1.0 },
        { from: 1.0, to: 5.0 },
        { from: 5.0, to: 10.0 },
        { from: 10.0, to: 20.0 },
        { from: 20.0, to: 50.0 },
        { from: 50.0 }
      ],
      boost: 2,
    },
  ];

  constructor(
    protected es: ElasticSearchService,
  ) {
  }

  async onApplicationBootstrap() {

  }

  setDebugMode(mode: boolean) {
    this.debugMode = mode;

    return this;
  }

  setEs(es: ElasticSearchService) {
    this.es = es;

    return this;
  }

  getEs() {
    return this.es;
  }

  protected formatSort(sort: string) {
    if (this.allowedSortFields.indexOf(sort) !== -1) {return sort}

    return this.defaultSort;
  }

  protected formatSortWay(way: 'asc'|'desc') : 'asc'|'desc' {
    if (['asc', 'desc'].indexOf(way) !== -1) {return way}

    return this.defaultWay;
  }

  async filter(args: ISearchArgs, withAggregations = false) {
    args.page = args.page || 1;
    args.limit = args.limit || 10;
    args.queryParameters = args.queryParameters || {};
    const aggregationSize = args.queryParameters['aggSize'] ? parseInt(args.queryParameters['aggSize']) : 30;
    // Build the query

    const q = this.es
      .resetFilters()
      .setAutoCompleteFields(this.autoCompleteFields)
      .setAggregationFields(this.aggregationFields)
      .setSearchWithAggregations(withAggregations)
      // .setAggregationSizeForAll(aggregationSize)
      .addSort(this.formatSort(args.queryParameters.sort), this.formatSortWay(args.queryParameters.way))
      .setDebugMode(this.debugMode);

    if (args.q) {
      q.filterAggregationsBasedOnQueryString(args.q);
      q.addAutoCompleteQuery(args.q, 'must');
    }


    // Look up for the query parameters in the allowed parameter list
    for (let key in args.queryParameters) {
      const found = this.es.aggregationFields.find(field => {
        if (field.alias) {
          return field.alias === key;
        }

        return field.name === key;
      });

      if (!found) {continue;}


      if (!Array.isArray(args.queryParameters[key]) && found.type !== 'range') {
        //convert to bool here, mind the array
        const val = (found.fieldType === 'boolean') ? (args.queryParameters[key] === 'false' ? false : true) : args.queryParameters[key];
        found.type === "simple" ? q.addTermFilter(key, val) : q.addNestedFilter(`${key}.slug`, val);
      }
      else if (typeof args.queryParameters[key] === 'object' && found.type === 'range') {
        q.addRangeQuery(key, found.dataType === 'number' ? parseInt(args.queryParameters[key]) : args.queryParameters[key], 'must', found.boost || 1);
      }
      else {
        args.queryParameters[key].forEach(value => {
          const val = (found.fieldType === 'boolean') ? (value === 'false' ? false : true) : value;
          let nestedValueQuery = `${key}.slug`;
          if (found.alias) {
            // we use the .keyword cause these fields are dynamic and not in the index
            nestedValueQuery = found.slugKey ? `${found.name}.${found.slugKey}.keyword` : `${found.name}.slug`;
          }
          found.type === "simple" ? q.addTermFilter(key, val) : q.addNestedFilter(nestedValueQuery, val);
        });
      }
    }

    const res = await q.search(args.limit, args.page);

    res.aggregations = await this.fixAggregationSlugs(res.aggregations);

    // Return fields that are not hidden
    const data = res.data.map(item => {

      for (let key in item) {
        if (this.hiddenFields.indexOf(key) === -1) {continue;}

        delete item[key];
      }

      return item;
    });

    return {...res, ...{data}};
  }

  private async fixAggregationSlugs(aggregations: IElasticSearchAggregationBucketResult[] | any[]) {

    for (let idx = 0; this.es.aggregationFields.length > idx; idx++) {

      if (!this.es.aggregationFields[idx].fixSlugs) {continue;}

      const aggregationIdx = aggregations.findIndex(a => a.key === this.es.aggregationFields[idx].name);

      if (aggregationIdx === -1) {continue;}



      aggregations[aggregationIdx] = await this.fixAggregationSlug(aggregations[aggregationIdx], this.es.aggregationFields[idx]);
    }

    return aggregations;
  }

  /**
   * Look up in cache to get the proper slugs for this type of doc
   * @param aggregation
   * @private
   */
  private fixAggregationSlug(aggregation: IElasticSearchAggregationBucketResult, field: IElasticSearchFilterMap) {

    /*let data;
    try {
      data = await (new CacheWpendpointsService(new HttpService())).getFromCache(aggregation.key);
    }
    catch (e) {
      console.log(`Could not get ${aggregation.key} from cache`, e)

      return aggregation;
    }



    */

/*    if (field.alias) {
      aggregation['key'] = field.alias;
    }*/

/*    aggregation.results.forEach((res, idx) => {
      const found = data.find(d => res.key === d.name);
      if (!found) {return;}
      aggregation.results[idx].slug = found.slug;
    })*/

    return aggregation;
  }
}
