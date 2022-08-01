import { IGenericObject } from "../models/general";

export interface IElasticSearchOptions {
  index?: string;
  aggregationFields?: IElasticSearchFilterMap[];
  lang?: string;
}

export interface IElasticSearchAggregation {
  [key: string] : {
    terms: {
      field: string;
    }
  }
}

export interface IElasticSearchAggregationBucket {
  key: string;
  slug?: string;
  doc_count: number;
}

export interface IElasticSearchAggregationResult {
  [key: string] : {
    buckets: IElasticSearchAggregationBucket[]
  }
}

export interface IElasticSearchAggregationBucketResult {
  key: string
  results: IElasticSearchAggregationBucket[];
}

export interface IElasticSearchResults<T> {
  data: T[];
  aggregations: IElasticSearchAggregationBucketResult[];
  total: number;
  from: number;
  limit: number;
  page: number;
  pages: number;
}

export interface IElasticSearchHit<T> {
  _source: T;
  _index: string;
  _id: string;
  _score: number;
  _type: string;
}

export interface IElasticSearchTextFilter {
  key: string;
  value: string;
}

export interface IElasticSearchGeoFilter {
  distance: string;
  key: string;
  location: IElasticSearchPoint;
}

export interface IElasticSearchFilter<T> {
  type: 'text'|'geo';
  nested?: IGenericObject;
  filter: T;
}

export interface IElasticSearchPoint {
  lat: number;
  lon: number;
}

export interface IElasticSearchFilterMap {
  name: string;
  type: 'nested'|'simple',
  key?: string,
  multilingual?: boolean;
  buckets?: string[];
  isKeyword?: boolean;
  inAutoComplete?: string[];
}
