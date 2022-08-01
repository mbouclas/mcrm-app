import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ElasticSearchService } from "./elastic-search.service";
import { IElasticSearchOptions } from "./elastic-search.models";
import { Client } from "@elastic/elasticsearch";
import { readFileSync } from "fs";
import { join } from "path";
import { ConfigModule } from "@nestjs/config";

export const ELASTIC_SEARCH_DRIVER = "ELASTIC_SEARCH_DRIVER";
export const ELASTIC_SEARCH_CONFIG = "ELASTIC_SEARCH_CONFIG";

const connectionFactory = {
  provide: ELASTIC_SEARCH_DRIVER,
  useFactory: (config: IElasticSearchOptions) => {
    return createElasticSearchDriver(config);
  },
};

@Module({
  providers: [
    connectionFactory,
    ElasticSearchService,
  ],
  exports: [
    ElasticSearchService,
  ]
})
export class ElasticSearchModule {
/*  static forRoot(config: IElasticSearchOptions = {} as IElasticSearchOptions): DynamicModule {
    return {
      module: ElasticSearchModule,
      global: true,
      providers: [
        {
          provide: ELASTIC_SEARCH_CONFIG,
          useValue: config
        },
        {
          provide: ELASTIC_SEARCH_DRIVER,
          inject: [ELASTIC_SEARCH_CONFIG],
          useFactory: async (config: IElasticSearchOptions) => createElasticSearchDriver(config)
        },
        ElasticSearchService
      ],
      exports: [
        ElasticSearchService
      ]
    };
  }

  static forRootAsync(configProvider): DynamicModule {
    return {
      module: ElasticSearchModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: ELASTIC_SEARCH_CONFIG,
          ...configProvider
        } as Provider<any>,
        {
          provide: ELASTIC_SEARCH_DRIVER,
          inject: [ELASTIC_SEARCH_CONFIG],
          useFactory: async (config: IElasticSearchOptions) => createElasticSearchDriver(config)
        },
        ElasticSearchService
      ],
      exports: [
        ElasticSearchService
      ]
    };
  }*/
}

async function createElasticSearchDriver(config: IElasticSearchOptions) {
  return new Client({
    node: process.env.ELASTIC_SEARCH_URL,
    auth: {
      apiKey: {
        api_key: process.env.ELASTIC_SEARCH_API_KEY,
        id: process.env.ELASTIC_SEARCH_API_KEY_ID
      }
    },
    ssl: {
      // ca: readFileSync(join(__dirname, "../../", process.env.ELASTIC_SEARCH_CERT as string)),
      rejectUnauthorized: false
    }
  });
}
