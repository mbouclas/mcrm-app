import { store } from "~root/state";

require('dotenv').config();
import { Neo4jService } from "~root/neo4j/neo4j.service";
import { Test, TestingModule } from '@nestjs/testing';
import { PageCategoryService } from './page-category.service';
import { ModelsService } from "~admin/services/models.service";
import { NEO4J_CONFIG, NEO4J_DRIVER } from "~root/neo4j/neo4j.constants";
import { defaultNeo4JConfig } from "~root/neo4j/neo4j.module";
import { ConfigModule } from "@nestjs/config";
import { Neo4jConfig } from "~root/neo4j/neo4j-config.interface";
import { createDriver } from "~root/neo4j/neo4j.util";
import { SharedModule } from "~shared/shared.module";
import { crudOperator } from "~helpers/crudOperator";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PageCategoryModel } from "../models/page-category.model";
import { BaseTreeModel } from "~models/generic.model";
import { BaseModel } from "~models/base.model";
import { IGenericObject } from "~models/general";

describe('PageCategoryService', () => {
  let pageCategoryService: PageCategoryService;

  const pageCategoryItem = Object.freeze({
    title: 'My category',
    description: 'My description',
    createdAt: new Date(),
    updatedAt: new Date(),

  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: ".",
          verboseMemoryLeak: true
        }),
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
        PageCategoryModel,
        SharedModule,
      ]
    }).compile();

    const neo4jService = module.get<Neo4jService>(Neo4jService);//Load the Neo4j service
    const driver = await createDriver(defaultNeo4JConfig);// Initialize the driver
    neo4jService.setDriver(driver);// Manually add the driver instance cause the DI is worthless
    Neo4jService.driverInstance = driver;// Associate the driver

    const modelService: ModelsService = module.get<ModelsService>(ModelsService);//Get the model service so that we can load them into the store
    await modelService.mergeModels();// Load all the models into the store
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [
        PageCategoryService,
        PageCategoryModel,
      ],
    }).compile();


    pageCategoryService = module.get<PageCategoryService>(PageCategoryService);
    pageCategoryService.setModel(store.getState().models['PageCategory']);
  });

  it('should be defined', () => {
    expect(pageCategoryService).toBeDefined();
  });


  it("should save page category and override tree", async () => {
    // const pageCategoryCrudOperator = crudOperator(pageCategoryService, pageCategoryItem);
    // const pageCategory2CrudOperator = crudOperator(pageCategoryService, pageCategoryItem);
    // const pageCategory3CrudOperator = crudOperator(pageCategoryService, pageCategoryItem);
    // const pageCategory4CrudOperator = crudOperator(pageCategoryService, pageCategoryItem);

    // const page = await pageCategoryCrudOperator.create();
    // const page2 = await pageCategory2CrudOperator.create();
    // const page3 = await pageCategory3CrudOperator.create();
    // const page4 = await pageCategory4CrudOperator.create();

    // await pageCategoryService.attachModelToAnotherModel(
    //   store.getState().models['PageCategory'],
    //   {
    //     uuid: page.uuid
    //   },
    //   store.getState().models["PageCategory"],
    //   {
    //     uuid: page2.uuid
    //   }, 'related'
    // );


    // await pageCategoryService.attachModelToAnotherModel(
    //   store.getState().models['PageCategory'],
    //   {
    //     uuid: page.uuid
    //   },
    //   store.getState().models["PageCategory"],
    //   {
    //     uuid: page3.uuid
    //   }, 'related'
    // );



    const set = (obj: IGenericObject) => {
      return this;
    };

    const newTree: BaseTreeModel = {
      ...pageCategoryItem,
      set,
      children: [{
        ...pageCategoryItem,
        set,
        children: [{
          ...pageCategoryItem,
          set,
          children: []
        }]
      }, {
        ...pageCategoryItem,
        set,
        children: []
      }]
    }

    const createdTree = await pageCategoryService.createTree(
      store.getState().models['PageCategory'],
      newTree,
      'related'
    );

    expect(createdTree).toBe(true);


    // await pageCategoryCrudOperator.delete();
    // await pageCategory2CrudOperator.delete();
    // await pageCategory3CrudOperator.delete();
    // await pageCategory4CrudOperator.delete();
  });
});

