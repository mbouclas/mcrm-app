import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { Neo4jConfig, Neo4jScheme } from "./neo4j-config.interface";
import { NEO4J_CONFIG, NEO4J_DRIVER } from './neo4j.constants';
import { createDriver } from './neo4j.util';
import { Neo4jTransactionInterceptor } from './neo4j-transaction.interceptor';
import { ModuleRef } from "@nestjs/core";

export const defaultNeo4JConfig = {
    scheme: process.env.NEO4J_SCHEME as Neo4jScheme,
    host: process.env.NEO4J_HOST,
    port: process.env.NEO4J_PORT,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    database: process.env.NEO4J_DATABASE,
};

const connectionFactory = {
    provide: NEO4J_DRIVER,
    useFactory: (config: Neo4jConfig) => {
        if (!config) {
            config = defaultNeo4JConfig;
        }
        return createDriver(config);
    }
}
@Module({
    providers: [
    {
        provide: NEO4J_CONFIG,
        useValue: defaultNeo4JConfig,
    },
      connectionFactory,
      Neo4jService,
    ],
    exports: [
      Neo4jService,
    ]
})
export class Neo4jModule {
    static moduleRef: ModuleRef;
    constructor(private m: ModuleRef) {

    }

    onModuleInit(): any {
        Neo4jModule.moduleRef = this.m;
    }

    static getService(service: any) {
        return Neo4jModule.moduleRef.get(service);
    }

/*    static forRoot(config: Neo4jConfig): DynamicModule {
        return {
            module: Neo4jModule,
            global: true,
            providers: [
                {
                    provide: NEO4J_CONFIG,
                    useValue: config,
                },
                {
                    provide: NEO4J_DRIVER,
                    inject: [ NEO4J_CONFIG ],
                    useFactory: async (config: Neo4jConfig) => createDriver(config),
                },
                Neo4jService,
            ],
            exports: [
                Neo4jService,
                Neo4jTransactionInterceptor,
            ]
        }
    }

    static forRootAsync(configProvider): DynamicModule {
        return {
            module: Neo4jModule,
            global: true,
            imports: [ ConfigModule ],

            providers: [
                {
                    provide: NEO4J_CONFIG,
                    ...configProvider
                } as Provider<any>,
                {
                    provide: NEO4J_DRIVER,
                    inject: [ NEO4J_CONFIG ],
                    useFactory: async (config: Neo4jConfig) => createDriver(config),
                },
                Neo4jService,
            ],
            exports: [
                Neo4jService,
                NEO4J_DRIVER,
                NEO4J_CONFIG,
            ]
        }
    }*/

}
