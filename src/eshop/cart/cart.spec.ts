import { store } from "~root/state";

require('dotenv').config();
import { Neo4jService } from "~root/neo4j/neo4j.service";
import { Test, TestingModule } from '@nestjs/testing';
import { CartService, ICartItem } from "./cart.service";
import { Cart } from "~eshop/cart/Cart";
import { ProductService } from "~catalogue/product/services/product.service";
import { ModelsService } from "~admin/services/models.service";
import { NEO4J_CONFIG, NEO4J_DRIVER } from "~root/neo4j/neo4j.constants";
import { defaultNeo4JConfig } from "~root/neo4j/neo4j.module";
import { ConfigModule } from "@nestjs/config";
import { Neo4jConfig } from "~root/neo4j/neo4j-config.interface";
import { createDriver } from "~root/neo4j/neo4j.util";
import { ProductModel } from "~catalogue/product/models/product.model";
import { CartModel } from "../models/Cart.model";
import { SharedModule } from "~shared/shared.module";
import { EventEmitterModule } from "@nestjs/event-emitter";



describe('CartService', () => {
  let service: CartService;
  let productService: ProductService;
  const cartItem = {
    productId: '94dce94a-f3ab-460f-ab1b-c6ac3dc5e08b',
    title: 'Betty',
    price: 10,
    quantity: 1,
    metaData: {
      slug: 'betty'
    }
  };

  const cartItem2= {
    id: '94dce94a-f3ab-460f-ab1b-c6ac3dc5esad5',
    title: 'A product',
    price: 12,
    quantity: 1,
    metaData: {
      slug: 'a-product'
    }
  };



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
        ProductModel,//Need to load the models otherwise you can't access the DB
        CartModel,
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
        CartService,
        ProductService
      ],
    }).compile();


    service = module.get<CartService>(CartService);
    productService = module.get<ProductService>(ProductService);
    productService.setModel(store.getState().models['Product']);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new cart', async () => {
    const cart = new Cart();
    await cart.initialize();
    expect(cart).toBeDefined();
    expect(cart.id).toBeDefined();
  });

  it('should add a new item to the cart', async () => {
    const cart = new Cart();
    const cartItem = {
      id: '94dce94a-f3ab-460f-ab1b-c6ac3dc5e08b',
      title: 'Betty',
      price: 10,
      quantity: 1,
      metaData: {
        slug: 'betty'
      }
    };

    cart.add(cloneCartItem(cartItem));
    expect(cart.items.length).toEqual(1);
    expect(cart.subTotal).toEqual(10);
  });

  it("should increase the quantity when adding the same item twice", () => {
    const cart = new Cart();

    // const product = await productService.findOne({ slug: "betty" });

    cart.add(cloneCartItem(cartItem));
    cart.add(cloneCartItem(cartItem));

    expect(cart.items.length).toEqual(1);
    expect(cart.subTotal).toEqual(cartItem.price * 2);
  });

  it("should adjust the quantity when adding the same item twice", () => {
    const cart = new Cart();
    const item1 = cloneCartItem(cartItem);
    item1.quantity = 2;
    cart.add(item1);
    expect(cart.subTotal).toEqual(cartItem.price * 2);

    const item2 = cloneCartItem(cartItem);
    cart.add(item2);

    expect(cart.subTotal).toEqual(cartItem.price * 3);
  });

  it("should overwrite the cart quantity when adding the same item with a different quantity and the overwriteQuantity flag is set", function() {
    const cart = new Cart();
    const item1 = cloneCartItem(cartItem);
    item1.quantity = 2;
    cart.add(item1);
    expect(cart.subTotal).toEqual(cartItem.price * 2);

    const item2 = cloneCartItem(cartItem);
    cart.add(item2, true);

    expect(cart.subTotal).toEqual(cartItem.price);
  });

  it("should remove an item if the quantity is 0", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));
    expect(cart.items.length).toEqual(1);

    const item = cloneCartItem(cartItem);
    item.quantity = 0;

    cart.add(item);

    expect(cart.items.length).toEqual(0);
  });

  it("should increase the quantity by filter", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    cart.updateQuantity({id: cartItem.productId}, 2);

    expect(cart.getItem({id: cartItem.productId}).quantity).toEqual(3);
    expect(cart.subTotal).toEqual(cartItem.price * 3);
  });

  it("should update the quantity by filter", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));
    cart.updateQuantity({id: cartItem.productId}, 5, false);

    expect(cart.getItem({id: cartItem.productId}).quantity).toEqual(5);
    expect(cart.subTotal).toEqual(cartItem.price * 5);
  });


  it("should add product variants to the cart", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    const variant = Object.assign({}, cartItem) as unknown as ICartItem;
    variant.price = 12;

    variant.metaData = {...variant.metaData, ...{color: 'red'}};

    cart.add(variant);

    expect(cart.items.length).toEqual(2);
    expect(cart.subTotal).toEqual(cartItem.price + variant.price);
  });

  it("should get the cart count", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));
    cart.add(cloneCartItem(cartItem));
    cart.add(cloneCartItem(cartItem2));

    expect(cart.count()).toEqual(3);
  });

  it("should get the items subtotal", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));
    cart.add(cloneCartItem(cartItem2));

    expect(cart.subTotal).toEqual(cartItem.price + cartItem2.price);

    cart.remove({id: cartItem2.id});

    expect(cart.subTotal).toEqual(cartItem.price);
  });

  it("should add the same variant to the cart and increase quantity", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    const variant = Object.assign({}, cartItem) as unknown as ICartItem;
    variant.price = 12;
    variant.metaData = {...variant.metaData, ...{color: 'red'}};

    cart.add(variant);
    cart.add(variant);

    expect(cart.items.length).toEqual(2);
    expect(cart.subTotal).toEqual(cartItem.price + (variant.price * 2));
  });


  it("should return the cart as an object", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    expect(cart.toObject().items[0].productId).toEqual(cartItem.productId);
    expect(cart.toObject().items[0].price).toEqual(cartItem.price);
  });

  it("should remove an item from the cart", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    cart.remove({id: cartItem.productId});

    expect(cart.items.length).toEqual(0);
  });

  it("should save the cart to db", () => {

  });

  it("should remove the cart from db", () => {

  });

  it("should remove the cart from db", () => {

  });


  it("should clear the cart", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    expect(cart.items.length).toEqual(1);
    expect(cart.subTotal).toEqual(cartItem.price);

    cart.clear();

    expect(cart.items.length).toEqual(0);
    expect(cart.subTotal).toEqual(0);
  });

  it("should test if the cart is empty", () => {
    const cart = new Cart();
    expect(cart.isEmpty()).toEqual(true);

  });

  it("should get the metaData of an item", () => {
    const cart = new Cart();
    cart.add(cloneCartItem(cartItem));

    expect(cart.getMetaData({id: cartItem.productId})).toHaveProperty('slug');
  });

  it("should get initialized with the default settings", () => {
    const cart = new Cart();
    expect(cart.getCartSettings()).toEqual(cart.getCartDefaultSettings());
  });

  it("should change the cart settings", () => {
    const cart = new Cart();
    cart.setCartSettings({
      thousandsSep: ',',
      decPoint: '.',
      decimals: 1,
      formatNumbers: true
    });

    expect(cart.getCartSettings().decimals).toEqual(1);
    expect(cart.getCartSettings().formatNumbers).toEqual(true);
  });

  function cloneCartItem(item) {
    return JSON.parse(JSON.stringify(item));
  }
});

