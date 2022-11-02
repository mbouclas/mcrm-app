import { store } from '~root/state';

require('dotenv').config();
import { Neo4jService } from '~root/neo4j/neo4j.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { ModelsService } from '~admin/services/models.service';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '~root/neo4j/neo4j.constants';
import { defaultNeo4JConfig } from '~root/neo4j/neo4j.module';
import { ConfigModule } from '@nestjs/config';
import { Neo4jConfig } from '~root/neo4j/neo4j-config.interface';
import { createDriver } from '~root/neo4j/neo4j.util';
import { OrderModel } from '../models/order.model';
import { SharedModule } from '~shared/shared.module';
import { crudOperator } from '~helpers/crudOperator';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('OrderService', () => {
  let service: OrderService;

  const orderItem = Object.freeze({
    total: 40,
    shippingMethod: 'ship1',
    paymentMethod: 'payment1',
    notes: 'user note',
    status: 3,
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
        OrderModel,
        OrderService,
        SharedModule,
      ],
    }).compile();

    const neo4jService = module.get<Neo4jService>(Neo4jService); //Load the Neo4j service
    const driver = await createDriver(defaultNeo4JConfig); // Initialize the driver
    neo4jService.setDriver(driver); // Manually add the driver instance cause the DI is worthless
    Neo4jService.driverInstance = driver; // Associate the driver

    const modelService: ModelsService =
      module.get<ModelsService>(ModelsService); //Get the model service so that we can load them into the store
    await modelService.mergeModels(); // Load all the models into the store
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);

    service.setModel(store.getState().models['Order']);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save page to db', async () => {
    const orderCrudOperator = crudOperator(service, orderItem);
    const createdOrder = await orderCrudOperator.create();

    expect(createdOrder.total).toEqual(orderItem.total);
    expect(orderItem.paymentMethod).toEqual(orderItem.paymentMethod);
    expect(orderItem.shippingMethod).toEqual(orderItem.shippingMethod);

    await orderCrudOperator.delete();
  });

  it('should delete the page to db', async () => {
    const orderCrudOperator = crudOperator(service, orderItem);
    await orderCrudOperator.create();
    const deletedOrder = await orderCrudOperator.delete();

    expect(deletedOrder.success).toEqual(true);
  });

  it('should save and find the page in db', async () => {
    const orderCrudOperator = crudOperator(service, orderItem);
    await orderCrudOperator.create();

    const foundOrder = await orderCrudOperator.findOne();

    expect(foundOrder.total).toEqual(orderItem.total);
    expect(foundOrder.paymentMethod).toEqual(orderItem.paymentMethod);
    expect(foundOrder.shippingMethod).toEqual(orderItem.shippingMethod);

    await orderCrudOperator.delete();
  });

  it('should save and update the page in db', async () => {
    const orderCrudOperator = crudOperator(service, orderItem);
    await orderCrudOperator.create();
    await orderCrudOperator.update({ total: 50 });

    const foundOrder = await orderCrudOperator.findOne();

    expect(foundOrder.total).toEqual(50);
    expect(foundOrder.paymentMethod).toEqual(orderItem.paymentMethod);
    expect(foundOrder.shippingMethod).toEqual(orderItem.shippingMethod);

    await orderCrudOperator.delete();
  });
});
