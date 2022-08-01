import {  Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Client } from "@elastic/elasticsearch";
import {  ELASTIC_SEARCH_DRIVER } from "./elastic-search.module";
import { ModuleRef } from "@nestjs/core";


@Injectable()
export class ElasticSearchService implements OnApplicationShutdown {
  protected lang = 'en';
  protected index: string;
  public client: Client;

  constructor(
    private moduleRef: ModuleRef
    // @Inject(ELASTIC_SEARCH_DRIVER) private readonly client: Client
  ) {
    this.client = this.moduleRef.get(ELASTIC_SEARCH_DRIVER);
  }

  public setIndex(index: string) {
    this.index = index;

    return this;
  }

  async onApplicationShutdown(signal?: string) {
    await this.client.close();
  }

}
