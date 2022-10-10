import { store } from "~root/state";

require('dotenv').config();
import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from "~eshop/cart/cart.service";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { CartModule } from "~eshop/cart/cart.module";
import { INestApplication } from "@nestjs/common";
import * as request from 'supertest';
import { NEO4J_CONFIG, NEO4J_DRIVER } from "~neo4j/neo4j.constants";
import { defaultNeo4JConfig } from "~neo4j/neo4j.module";
import { Neo4jConfig } from "~neo4j/neo4j-config.interface";
import { createDriver } from "~neo4j/neo4j.util";
import { Neo4jService } from "~neo4j/neo4j.service";
import { ModelsService } from "~admin/services/models.service";
import { ProductModel } from "~catalogue/product/models/product.model";
import { CartModel } from "~eshop/models/Cart.model";
import { SharedModule } from "~shared/shared.module";

describe('CartController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: ".",
          verboseMemoryLeak: true
        }),
        CartModule
      ],
      providers: [
        {
          provide: NEO4J_CONFIG,
          useValue: defaultNeo4JConfig,
        },
        {
          provide: NEO4J_DRIVER,
          useFactory: (config: Neo4jConfig) => {
            if (!config) {
              config = defaultNeo4JConfig;
            }
            return createDriver(config);
          }
        },
        Neo4jService,
        ModelsService,
        ProductModel,//Need to load the models otherwise you can't access the DB
        CartModel,
        SharedModule,
      ]
    })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });


  it(`/GET `, () => {
    return request(app.getHttpServer())
      .post('/api/cart/add')
      .expect(200);
  });
});
