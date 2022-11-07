import { store } from '~root/state';

require('dotenv').config();
import { Neo4jService } from '~root/neo4j/neo4j.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-method.service';
import { ModelsService } from '~admin/services/models.service';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '~root/neo4j/neo4j.constants';
import { defaultNeo4JConfig } from '~root/neo4j/neo4j.module';
import { ConfigModule } from '@nestjs/config';
import { Neo4jConfig } from '~root/neo4j/neo4j-config.interface';
import { createDriver } from '~root/neo4j/neo4j.util';
import { PaymentMethodModel } from '../models/payment-method.model';
import { SharedModule } from '~shared/shared.module';
import { crudOperator } from '~helpers/crudOperator';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;

  const paymentMethodItem = Object.freeze({
    title: 'Payment method title',
    description: 'Payment method descripton',
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
        PaymentMethodModel,
        PaymentMethodService,
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
      providers: [PaymentMethodService],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
    service.setModel(store.getState().models['PaymentMethod']);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save paymentMethod to db', async () => {
    const paymentMethodCrudOperator = crudOperator(service, paymentMethodItem);
    const createdPaymentMethod = await paymentMethodCrudOperator.create();

    expect(createdPaymentMethod.title).toEqual(paymentMethodItem.title);
    expect(paymentMethodItem.description).toEqual(
      paymentMethodItem.description,
    );
    expect(paymentMethodItem.status).toEqual(paymentMethodItem.status);

    await paymentMethodCrudOperator.delete();
  });

  it('should delete the paymentMethod from db', async () => {
    const paymentMethodCrudOperator = crudOperator(service, paymentMethodItem);
    await paymentMethodCrudOperator.create();
    const deletedPaymentMethod = await paymentMethodCrudOperator.delete();

    expect(deletedPaymentMethod.success).toEqual(true);
  });

  it('should save and find the paymentMethod in db', async () => {
    const paymentMethodCrudOperator = crudOperator(service, paymentMethodItem);
    await paymentMethodCrudOperator.create();

    const foundPaymentMethod = await paymentMethodCrudOperator.findOne();

    expect(foundPaymentMethod.title).toEqual(paymentMethodItem.title);
    expect(foundPaymentMethod.description).toEqual(
      paymentMethodItem.description,
    );
    expect(foundPaymentMethod.status).toEqual(paymentMethodItem.status);

    await paymentMethodCrudOperator.delete();
  });

  it('should save and update the paymentMethod in db', async () => {
    const paymentMethodCrudOperator = crudOperator(service, paymentMethodItem);
    await paymentMethodCrudOperator.create();

    const newTitle = 'PaymentMethod item 2';

    await paymentMethodCrudOperator.update({
      title: newTitle,
    });

    const foundPaymentMethod = await paymentMethodCrudOperator.findOne();

    expect(foundPaymentMethod.title).toEqual(newTitle);
    expect(foundPaymentMethod.description).toEqual(
      paymentMethodItem.description,
    );
    expect(foundPaymentMethod.status).toEqual(paymentMethodItem.status);

    await paymentMethodCrudOperator.delete();
  });
});
