import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { OrderModel } from '~eshop/order/models/order.model';
import { BaseNeoService, IBaseNeoServiceRelationships } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from '~models/general';
import { SharedModule } from '~shared/shared.module';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { v4 } from 'uuid';
import { IAddress, ICheckoutStore, IPaymentMethod, IShippingMethod } from '~eshop/models/checkout';
import { AddressService } from '~eshop/address/services/address.service';
import { InvalidOrderException } from '~eshop/order/exceptions/invalid-order.exception';
import { PaymentMethodService } from '~eshop/payment-method/services/payment-method.service';
import { ShippingMethodService } from '~eshop/shipping-method/services/shipping-method.service';
import { ICartItem } from '~eshop/cart/cart.service';
import { ProductModel } from '~catalogue/product/models/product.model';
import { ProductService } from '~catalogue/product/services/product.service';
import { CartItem } from '~eshop/cart/CartItem';

export class OrderModelDto {
  orderId?: string;
  userId?: string;
  tempUuid?: string;
  uuid?: string;
  total?: number;
  shippingMethod?: string;
  paymentMethod?: string;
  notes?: string;
  status?: number;
  salesChannel?: string;
  billingAddressId?: string;
  shippingAddressId?: string;
  paymentStatus?: number;
  shippingStatus?: number;
  paymentInfo?: string;
  shippingInfo?: string;
  VAT?: number;
}

export enum OrderEventNames {
  orderCreated = 'order.created',
  orderUpdated = 'order.updated',
  orderDeleted = 'order.deleted',
  orderStatusChanged = 'order.status.changed',
  orderPaymentStatusChanged = 'order.payment.status.changed',
  orderShippingStatusChanged = 'order.shipping.status.changed',
  orderCompleted = 'order.completed',
  orderCancelled = 'order.cancelled',
  orderShipped = 'order.shipped',
  orderPaid = 'order.paid',
  orderRefunded = 'order.refunded',
  orderPartiallyRefunded = 'order.partially.refunded',
  orderAttachedToNodes = 'order.attached.to.nodes',
}

@Injectable()
export class OrderService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  public static onOrderCompletedEventName = 'order.completed';

  static statuses = [
    {
      id: 1,
      label: 'started',
    },
    {
      id: 2,
      label: 'processing',
    },
    {
      id: 3,
      label: 'shipped',
    },
    {
      id: 4,
      label: 'completed',
    },
    {
      id: 5,
      label: 'cancelled',
    },
  ];

  static paymentStatuses = [
    {
      id: 1,
      label: 'in-progress',
    },
    {
      id: 2,
      label: 'failed',
    },
    {
      id: 3,
      label: 'unconfirmed',
    },
    {
      id: 4,
      label: 'paid',
    },
    {
      id: 5,
      label: 'authorized',
    },
    {
      id: 6,
      label: 'refunded',
    },
  ];

  static shippingStatuses = [
    {
      id: 1,
      label: 'in-progress',
    },
    {
      id: 2,
      label: 'open',
    },
    {
      id: 3,
      label: 'done',
    },
    {
      id: 4,
      label: 'cancelled',
    },
  ];

  static VAT = 0;

  constructor() {
    super();
    this.model = store.getState().models.Order;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    OrderService.statuses = store.getState().configs['store']['orderStatuses'];
    OrderService.VAT = store.getState().configs['store']['VAT'];
  }

  async findOne(filter: IGenericObject, rels = []): Promise<OrderModel> {
    const item = (await super.findOne(filter, rels)) as unknown as OrderModel;
    return item;
  }

  async findAll(filter: IGenericObject, rels = []): Promise<IPagination<IGenericObject>> {
    const items = (await super.find(filter, rels)) as IPagination<IGenericObject>;

    return items;
  }

  async findByRegex(key: string, value: string): Promise<OrderModel> {
    const query = `MATCH (n:Order)
    WHERE n.${key}  =~ '(?i).*${value}.*'
    RETURN n;
    `;

    const res = await this.neo.readWithCleanUp(query);

    if (!res || !res.length) {
      throw new RecordNotFoundException('Order with client secret not found');
    }

    return res[0];
  }

  async store(
    record: OrderModelDto,
    userId?: string,
    relationships?: Array<{
      id: string;
      name: string;
      relationshipProps?: IGenericObject;
    }>,
  ) {
    if (!record.status) {
      record.status = OrderService.statuses[0].id;
    }

    if (!record.paymentStatus) {
      record.paymentStatus = OrderService.paymentStatuses[0].id;
    }

    if (!record.shippingStatus) {
      record.shippingStatus = OrderService.shippingStatuses[0].id;
    }

    if (!record.salesChannel) {
      record.salesChannel = 'web';
    }

    if (!record.orderId) {
      record.orderId = await this.generateOrderId();
    }

    record.VAT = OrderService.VAT;

    try {
      const r = await super.store(record, userId, relationships);
      this.eventEmitter.emit(OrderEventNames.orderCreated, r);

      return r;
    } catch (e) {
      throw new InvalidOrderException('ORDER_STORE_ERROR', '900.0', e.getErrors());
    }
  }

  async update(
    uuid: string,
    record: OrderModelDto,
    userId?: string,
    relationships: IBaseNeoServiceRelationships[] = [],
    options?: IGenericObject,
  ) {
    if (record.status && !OrderService.statuses.map((status) => status.id).includes(record.status)) {
      throw new InvalidOrderException('INVALID_ORDER_STATUS', '900.2');
    }

    try {
      const r = await super.update(uuid, record, userId, relationships, options);
      this.eventEmitter.emit(OrderEventNames.orderUpdated, r);
      return r;
    } catch (e) {
      console.log(e);
      throw new InvalidOrderException('ORDER_UPDATE_ERROR', '900.1', e.getErrors());
    }
  }

  async processStoreOrder(order: ICheckoutStore) {
    // validate shipping information
    const shippingAddressValidation = AddressService.validateAddress(order.shippingInformation);
    if (!shippingAddressValidation.success) {
      throw new InvalidOrderException('INVALID_SHIPPING_ADDRESS', '700.1', shippingAddressValidation.errors as any);
    }
    // validate billing information
    const billingAddressValidation = AddressService.validateAddress(order.billingInformation);
    if (!billingAddressValidation.success) {
      throw new InvalidOrderException('INVALID_BILLING_ADDRESS', '700.2', billingAddressValidation.errors as any);
    }
    // validate contact information
    const contactInformationValidation = AddressService.validateContactInformation(order.contactInformation);
    if (!contactInformationValidation.success) {
      throw new InvalidOrderException(
        'INVALID_CONTACT_INFORMATION',
        '700.3',
        contactInformationValidation.errors as any,
      );
    }
    // validate payment method
    const paymentMethod = await this.validateStorePaymentMethod(order.paymentMethod);
    // validate shipping method
    const shippingMethod = await this.validateStoreShippingMethod(order.shippingMethod);

    return {
      paymentMethod,
      shippingMethod,
    };
  }

  async validateStorePaymentMethod(paymentMethod: IPaymentMethod) {
    if (!paymentMethod) {
      throw new InvalidOrderException('INVALID_PAYMENT_METHOD', '700.4');
    }

    const found = await new PaymentMethodService().findOne({ uuid: paymentMethod.uuid });
    if (!found) {
      throw new InvalidOrderException('INVALID_PAYMENT_METHOD', '700.4');
    }

    return found;
  }

  async validateStoreShippingMethod(shippingMethod: IShippingMethod) {
    if (!shippingMethod) {
      throw new InvalidOrderException('INVALID_SHIPPING_METHOD', '700.5');
    }

    const found = await new ShippingMethodService().findOne({ uuid: shippingMethod.uuid });
    if (!found) {
      throw new InvalidOrderException('INVALID_SHIPPING_METHOD', '700.5');
    }

    return found;
  }

  static calculateTotalPrice(items: ICartItem[]) {
    let total = 0;
    items.forEach((item) => {
      total += item.price * item.quantity;
    });

    return total;
  }

  async attachProductsToOrder(uuid, items: ICartItem[]) {
    let query = `MATCH (o:Order {uuid: '${uuid}'}) `;
    query += items
      .map((item, index) => {
        let q = '';
        if (item.variantId) {
          q += `MATCH (v${index}:ProductVariant {uuid: '${item.variantId}'}) `;
          q += `MERGE (o)-[r${index}:HAS_ITEM]->(v${index}) 
        ON CREATE SET r${index}.quantity = ${item.quantity}, r${index}.createdAt = timestamp()
        ON MATCH SET r${index}.quantity = ${item.quantity}, r${index}.updatedAt = timestamp()
        `;
          return q;
        }

        q += `MATCH (p${index}:Product {uuid: '${item.productId}'}) `;
        q += `MERGE (o)-[r${index}:HAS_ITEM]->(p${index})
      ON CREATE SET r${index}.quantity = ${item.quantity}, r${index}.createdAt = timestamp()
      ON MATCH SET r${index}.quantity = ${item.quantity}, r${index}.updatedAt = timestamp()
      `;

        return q;
      })
      .join('\n WITH * \n');

    query += `RETURN *`;

    try {
      await this.neo.write(query);
    } catch (e) {
      throw new InvalidOrderException('ORDER_STORE_ERROR', '900.1', e.getErrors());
    }

    return true;
  }

  /**
   * Attach addresses to order
   * @param orderId
   * @param addresses
   */
  async attachAddressesToOrder(
    orderId: string,
    addresses: IAddress[],
  ): Promise<{ unsavedAddresses: IAddress[]; correctAddresses: IAddress[] }> {
    const unsavedAddresses = addresses.filter((a) => !a.uuid);

    const correctAddresses = addresses.filter((a) => a.uuid);

    try {
      await this.neo.write(
        `
        MATCH (o:Order {uuid: '${orderId}'})
        UNWIND $addresses AS address
        MATCH (a:Address {uuid: address.uuid})
        MERGE (o)-[r:HAS_ADDRESS {type: address.type}]->(a)
        ON CREATE SET r.createdAt = timestamp(), r.type = address.type
        ON MATCH SET r.updatedAt = timestamp(), r.type = address.type
        return *
      `,
        { addresses: correctAddresses },
      );
    } catch (e) {
      console.log(e);
    }

    return { unsavedAddresses, correctAddresses };
  }

  async attachOrderProductsToUser(orderId: string) {
    const order = await this.findOne({uuid: orderId});
    const userId = order['userId'];
    const items = order['metaData']['cart']['items'];

    for (const item of items) {
      await this.attachUserToProductOrdered(orderId, userId, item['productId']);
    }

    return true;
  }

  async attachUserToProductOrdered(orderId: string, userId: string, productId: string) {
    const query = `
      MATCH (u:User {uuid: '${userId}'})
      MATCH (p:Product {uuid: '${productId}'})
      MERGE (u)-[r:HAS_BOUGHT {orderId: '${orderId}'}]->(p)
      ON CREATE SET r.createdAt = timestamp()
      ON MATCH SET r.updatedAt = timestamp()
      return *;
    `;

    try {
      return await this.neo.write(query);
    }
    catch (e) {
      console.log(`Error in attachUserToProductOrdered`, e.message);
      return null;
    }
  }

  static async validateCartItems(items: CartItem[]) {
    const products = await new ProductService().find({
      active: true,
      uuids: items.map((item) => item.productId),
    });
    // fix any "broken" prices
    const toRemove = [];
    // remove any products that are not available
    items.forEach((item, idx) => {
      const found = products.data.find((p) => p['uuid'] === item.productId) as ProductModel;
      if (!found) {
        toRemove.push(idx);
      }

      // Check stock, if not enough, remove item

      item.price = found.price;
    });

    toRemove.forEach((idx) => {
      items.splice(idx, 1);
    });

    return items;
  }

  private async generateOrderId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
