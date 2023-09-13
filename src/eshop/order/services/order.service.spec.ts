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
import { UserModel } from '~root/user/models/user.model';
import { UserService } from '~root/user/services/user.service';
import { PaymentMethodService } from '~root/eshop/payment-method/services/payment-method.service';
import { PaymentMethodModel } from '~root/eshop/payment-method/models/payment-method.model';
import { ShippingMethodService } from '~root/eshop/shipping-method/services/shipping-method.service';
import { ShippingMethodModel } from '~root/eshop/shipping-method/models/shipping-method.model';
import { ProductService } from '~root/catalogue/product/services/product.service';
import { ProductModel } from '~root/catalogue/product/models/product.model';
import { SharedModule } from '~shared/shared.module';
import { crudOperator } from '~helpers/crudOperator';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AddressService } from '~eshop/address/services/address.service';
import { CustomerPaymentMethodService } from '~root/eshop/customer/services/customer-payment-method.service';
import { PickUpProvider } from '~eshop/shipping-method/providers/pickUp.provider';

describe('OrderService', () => {
  let service: OrderService;
  let userService: UserService;
  let addressService: AddressService;
  let productService: ProductService;

  let paymentMethodService: PaymentMethodService;
  let customerPaymentMethodService: CustomerPaymentMethodService;
  let shippingMethodService: ShippingMethodService;

  const billingAddressItem = Object.freeze({
    city: 'City',
    type: 'BILLING',
  });

  const shippingAddressItem = Object.freeze({
    city: 'City',
    type: 'SHIPPING',
  });

  const orderItem = Object.freeze({
    total: 40,
    shippingMethod: 'ship1',
    paymentMethod: 'payment1',
    notes: 'user note',
    status: 1,
    paymentStatus: 1,
    shippingStatus: 1,
  });

  const userItem = Object.freeze({
    firstName: 'UserF1',
    lastName: 'UserF2',
  });

  const productItem = Object.freeze({
    title: 'Product1',
    slug: 'product1',
  });

  const paymentMethodItem = Object.freeze({
    title: 'Payment method title',
    description: 'Payment method descripton',
    status: true,
  });

  const shippingMethodItem = Object.freeze({
    title: 'Shipping method title',
    description: 'Shipping method descripton',
    status: true,
    settingsFields: {
      deliveryTime: 'delivery time',
      trackingUrl: 'url',
      description: 'description',
    },
    providerName: 'pickUp',
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
        UserService,
        UserModel,
        ProductService,
        ProductModel,
        SharedModule,
        PaymentMethodService,
        PaymentMethodModel,
        ShippingMethodService,
        ShippingMethodModel,
        AddressService,
        CustomerPaymentMethodService,
      ],
    }).compile();

    const neo4jService = module.get<Neo4jService>(Neo4jService); //Load the Neo4j service
    const driver = await createDriver(defaultNeo4JConfig); // Initialize the driver
    neo4jService.setDriver(driver); // Manually add the driver instance cause the DI is worthless
    Neo4jService.driverInstance = driver; // Associate the driver

    const modelService: ModelsService = module.get<ModelsService>(ModelsService); //Get the model service so that we can load them into the store
    await modelService.mergeModels(); // Load all the models into the store
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        OrderService,
        UserService,
        ProductService,
        PaymentMethodService,
        ShippingMethodService,
        AddressService,
        CustomerPaymentMethodService,
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    service.setModel(store.getState().models['Order']);

    userService = module.get<UserService>(UserService);
    userService.setModel(store.getState().models['User']);

    productService = module.get<ProductService>(ProductService);
    productService.setModel(store.getState().models['Product']);

    paymentMethodService = module.get<PaymentMethodService>(PaymentMethodService);
    paymentMethodService.setModel(store.getState().models['PaymentMethod']);

    shippingMethodService = module.get<ShippingMethodService>(ShippingMethodService);
    shippingMethodService.setModel(store.getState().models['ShippingMethod']);

    addressService = module.get<AddressService>(AddressService);
    addressService.setModel(store.getState().models['Address']);

    customerPaymentMethodService = module.get<CustomerPaymentMethodService>(CustomerPaymentMethodService);
    customerPaymentMethodService.setModel(store.getState().models['CustomerPaymentMethod']);


  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save order', async () => {
    const userCrudOperator = crudOperator(userService, userItem);
    const user = await userCrudOperator.create();

    const orderCrudOperator = crudOperator(service, orderItem);

    const shippingMethodCrudOperator = crudOperator(shippingMethodService, shippingMethodItem);
    const billingAddressCrudOperator = crudOperator(addressService, billingAddressItem);
    const shippingAddressCrudOperator = crudOperator(addressService, shippingAddressItem);
    const productCrudOperator = crudOperator(productService, productItem);

    const shippingMethod = await shippingMethodCrudOperator.create();
    const billingAddress = await billingAddressCrudOperator.create();
    const shippingAddress = await shippingAddressCrudOperator.create();
    const product = await productCrudOperator.create();

    let rels = [
      {
        id: shippingAddress.uuid,
        name: 'address',
      },

      {
        id: billingAddress.uuid,
        name: 'address',
      },

      {
        id: shippingMethod.uuid,
        name: 'shippingMethod',
      },

      {
        id: user.uuid,
        name: 'user',
      },

      {
        id: product.uuid,
        name: 'product',
      },
    ];

    const order = await orderCrudOperator.create(null, rels);

    expect(order.status).toEqual(orderItem.status);

    await orderCrudOperator.delete();
    await billingAddressCrudOperator.delete();
    await shippingAddressCrudOperator.delete();
    await productCrudOperator.delete();
    await userCrudOperator.delete();
    await shippingMethodCrudOperator.delete();
  });
});
