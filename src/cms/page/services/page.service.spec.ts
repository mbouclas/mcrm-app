import { store } from "~root/state";

require('dotenv').config();
import { Neo4jService } from "~root/neo4j/neo4j.service";
import { Test, TestingModule } from '@nestjs/testing';
import { PageService } from './page.service';
import { ModelsService } from "~admin/services/models.service";
import { NEO4J_CONFIG, NEO4J_DRIVER } from "~root/neo4j/neo4j.constants";
import { defaultNeo4JConfig } from "~root/neo4j/neo4j.module";
import { ConfigModule } from "@nestjs/config";
import { Neo4jConfig } from "~root/neo4j/neo4j-config.interface";
import { createDriver } from "~root/neo4j/neo4j.util";
import { PageModel } from "../models/page.model";
import { SharedModule } from "~shared/shared.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

describe('PageService', () => {
  let service:PageService;

  const pageItem = {
    title: 'My page',
    slug: 'My page'
  };

  let page;

  afterAll(async () => {
    page?.uuid && await service.delete(page.uuid);
  })

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
        PageModel,
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
        PageService,
      ],
    }).compile();


    service = module.get<PageService>(PageService);
    service.setModel(store.getState().models['Page']);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should save the page to db", async () => {
    const createdPage = await service.store(pageItem); 

    page = await service.findOne({ uuid: createdPage.uuid }); 
    expect(page.title).toEqual(pageItem.title);
    expect(page.slug).toEqual('my-page');
  });

});

