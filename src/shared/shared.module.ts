import {  Module, OnModuleInit } from "@nestjs/common";
import { Neo4jModule } from "~neo4j/neo4j.module";
import * as redisStore from 'cache-manager-redis-store';
import { ElasticSearchModule } from "~es/elastic-search.module";
import { HttpModule } from "@nestjs/axios";
import { ModelSchematic } from "./schematics/model/model.schematic";
import { ServiceSchematic } from "~shared/schematics/service/service.schematic";
import { LazyModuleLoader, ModuleRef } from "@nestjs/core";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { LocationModel } from "~shared/models/location.model";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ExecutorsService } from "~shared/services/executors.service";
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import { AppModule } from "~root/app.module";

export enum SharedEventNames {
  CONFIG_LOADED = 'config.loaded',
}

// @ts-ignore
@Module({
  providers: [
    // redisProvider,
    ModelSchematic,
    ServiceSchematic,
    BaseNeoService,
    LocationModel,
    ExecutorsService,
    // LocationService,
    // BaseNeoTreeService,
  ],
  imports: [
    CacheModule.register<RedisClientOptions>({
      // @ts-ignore
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
    BaseNeoService,
  ],
})
export class SharedModule implements OnModuleInit {
  static eventEmitter: EventEmitter2;
  static moduleRef: ModuleRef;
  static lazyModuleLoader: LazyModuleLoader;
  constructor(
    private m: ModuleRef,
    private lazyModuleLoader: LazyModuleLoader,

  ) {
    SharedModule.eventEmitter = AppModule.eventEmitter;
    SharedModule.lazyModuleLoader = lazyModuleLoader;
  }

  onModuleInit(): any {
    SharedModule.moduleRef = this.m;
  }

  static getService(service: any) {
    return SharedModule.moduleRef.get(service);
  }
}
