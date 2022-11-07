import { store } from '~root/state';

require('dotenv').config();
import { Neo4jService } from '~root/neo4j/neo4j.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ShippingMethodService } from './shipping-method.service';
import { ModelsService } from '~admin/services/models.service';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '~root/neo4j/neo4j.constants';
import { defaultNeo4JConfig } from '~root/neo4j/neo4j.module';
import { ConfigModule } from '@nestjs/config';
import { Neo4jConfig } from '~root/neo4j/neo4j-config.interface';
import { createDriver } from '~root/neo4j/neo4j.util';
import { ShippingMethodModel } from '../models/shipping-method.model';
import { SharedModule } from '~shared/shared.module';
import { crudOperator } from '~helpers/crudOperator';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('ShippingMethodService', () => {
  let service: ShippingMethodService;

  const shippingMethodItem = Object.freeze({
    title: 'Shipping method title',
    description: 'Shipping method descripton',
    status: true,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: '.',
          verboseMemoryLeak: true,
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
          },
        },
        Neo4jService,
        ModelsService,
        ShippingMethodModel,
        ShippingMethodService,
        SharedModule,
      ],
    }).compile();

    const neo4jService = module.get<Neo4jService>(Neo4jService);
    const driver = await createDriver(defaultNeo4JConfig);
    neo4jService.setDriver(driver);
    Neo4jService.driverInstance = driver;

    const modelService: ModelsService =
      module.get<ModelsService>(ModelsService);
    await modelService.mergeModels();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [ShippingMethodService],
    }).compile();

    service = module.get<ShippingMethodService>(ShippingMethodService);
    service.setModel(store.getState().models['ShippingMethod']);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save shippingMethod to db', async () => {
    const shippingMethodCrudOperator = crudOperator(
      service,
      shippingMethodItem,
    );
    const createdShippingMethod = await shippingMethodCrudOperator.create();

    expect(createdShippingMethod.title).toEqual(shippingMethodItem.title);
    expect(shippingMethodItem.description).toEqual(
      shippingMethodItem.description,
    );
    expect(shippingMethodItem.status).toEqual(shippingMethodItem.status);

    await shippingMethodCrudOperator.delete();
  });

  it('should delete the shippingMethod from db', async () => {
    const shippingMethodCrudOperator = crudOperator(
      service,
      shippingMethodItem,
    );
    await shippingMethodCrudOperator.create();
    const deletedShippingMethod = await shippingMethodCrudOperator.delete();

    expect(deletedShippingMethod.success).toEqual(true);
  });

  it('should save and find the shippingMethod in db', async () => {
    const shippingMethodCrudOperator = crudOperator(
      service,
      shippingMethodItem,
    );
    await shippingMethodCrudOperator.create();

    const foundShippingMethod = await shippingMethodCrudOperator.findOne();

    expect(foundShippingMethod.title).toEqual(shippingMethodItem.title);
    expect(foundShippingMethod.description).toEqual(
      shippingMethodItem.description,
    );
    expect(foundShippingMethod.status).toEqual(shippingMethodItem.status);

    await shippingMethodCrudOperator.delete();
  });

  it('should save and update the shippingMethod in db', async () => {
    const shippingMethodCrudOperator = crudOperator(
      service,
      shippingMethodItem,
    );
    await shippingMethodCrudOperator.create();

    const newTitle = 'ShippingMethod item 2';

    await shippingMethodCrudOperator.update({
      title: newTitle,
    });

    const foundShippingMethod = await shippingMethodCrudOperator.findOne();

    expect(foundShippingMethod.title).toEqual(newTitle);
    expect(foundShippingMethod.description).toEqual(
      shippingMethodItem.description,
    );
    expect(foundShippingMethod.status).toEqual(shippingMethodItem.status);

    await shippingMethodCrudOperator.delete();
  });
});
