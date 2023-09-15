import { Injectable } from '@nestjs/common';
import { ElasticSearchService, ISearchArgs } from "~es/elastic-search.service";

@Injectable()
export class SimilarProductsSearchService {
  protected defaultSize = 6;
  protected similarFields = [
    {
      name: 'properties',
      path: 'properties',
      fields: ['properties.slug'],
    },
    {
      name: 'categories',
      path: 'categories',
      fields: ['categories.slug'],
    },
  ];
  protected debugMode = false;

  constructor(
    protected es: ElasticSearchService,
  ) {
  }

  setEs(es: ElasticSearchService) {
    this.es = es;

    return this;
  }

  setDebugMode(mode: boolean) {
    this.debugMode = mode;

    return this;
  }

  async search(id: number|string, args: ISearchArgs, index = null, fields = []) {
    const result = {};
    if (fields.length === 0) {
      fields = this.similarFields;
    }

    const similarQuery = this.similarFields
      .filter(field => fields.length === 0 || fields.includes(field.name))
      .map(field => (
      {
        nested: {
          path: field.path,
          query: {
            'more_like_this' : {
              fields: field.fields,
              "max_query_terms": 20,
              "min_term_freq": 1,
              "include": "false",
              "like":[{
                "_index": index || this.es.getIndex(),
                "_id": id
              }]
            }
          }
        }
      }
    ));

    if (!args.limit) {
      args.limit = this.defaultSize;
    }

    const query = {
      query: {
        bool: {
          must: similarQuery
        }
      }
    }

    const sort = [
      {
        "updatedAt": "desc"
      }
    ]

    // this.debugMode = true;
    const q = this.es
      .resetFilters()
      .setDebugMode(this.debugMode);

    return await q.rawQuery(query, args.limit,1, 0, sort);
  }
}
