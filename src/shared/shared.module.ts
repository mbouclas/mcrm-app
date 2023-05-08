import { CacheModule, Module, OnModuleInit } from "@nestjs/common";
import { Neo4jModule } from "../neo4j/neo4j.module";
import * as redisStore from 'cache-manager-redis-store';
import { ElasticSearchModule } from "../elastic-search/elastic-search.module";
import { HttpModule } from "@nestjs/axios";
import { redisProvider } from "../app.providers";
import { ModelSchematic } from "./schematics/model/model.schematic";
import { ServiceSchematic } from "~shared/schematics/service/service.schematic";
import { ModuleRef } from "@nestjs/core";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { LocationModel } from "~shared/models/location.model";
import { EventEmitter2 } from "@nestjs/event-emitter";


@Module({
  providers: [
    redisProvider,
    ModelSchematic,
    ServiceSchematic,
    BaseNeoService,
    LocationModel,
    // LocationService,
    // BaseNeoTreeService,
  ],
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      db: process.env.REDIS_DB || 0,
      ttl: 600,
      auth_pass: process.env.REDIS_AUTH
    }),
    Neo4jModule,
/*    Neo4jModule.forRootAsync({
      imports: [ ConfigModule ],
      exports: [Neo4jService],
      inject: [ ConfigService, ],
      useFactory: (configService: ConfigService) : Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      })
    }),*/
    ElasticSearchModule,
    HttpModule,
  ],
  exports: [
    CacheModule,
    Neo4jModule,
    ElasticSearchModule,
    HttpModule,
    redisProvider,
    BaseNeoService,
  ],
})
export class SharedModule implements OnModuleInit {
  static eventEmitter: EventEmitter2;
  static moduleRef: ModuleRef;
  constructor(
    private m: ModuleRef,
    private eventEmitter: EventEmitter2,
  ) {
    SharedModule.eventEmitter = eventEmitter;
  }

  onModuleInit(): any {
    SharedModule.moduleRef = this.m;
  }

  static getService(service: any) {
    return SharedModule.moduleRef.get(service);
  }
}
