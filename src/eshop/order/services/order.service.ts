import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { OrderModel } from '~eshop/order/models/order.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from '~models/general';
import { SharedModule } from '~shared/shared.module';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { RecordNotFoundException } from '~shared/exceptions/record-not-found.exception';
import { v4 } from 'uuid';
import { ICheckoutStore, IPaymentMethod, IShippingMethod } from "~eshop/models/checkout";
import { AddressService } from "~eshop/address/services/address.service";
import { InvalidOrderException } from "~eshop/order/exceptions/invalid-order.exception";
import { PaymentMethodService } from "~eshop/payment-method/services/payment-method.service";
import { ShippingMethodService } from "~eshop/shipping-method/services/shipping-method.service";

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

@Injectable()
export class OrderService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  protected eventEmitter: EventEmitter2;

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

  static VAT = 20;

  constructor() {
    super();
    this.model = store.getState().models.Order;

    this.changeLog = new ChangeLogService();

  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    OrderService.statuses = store.getState().configs['store']['orderStatuses'];
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
    const existsStatus = OrderService.statuses.some((statusItem) => statusItem.id === record.status);

    if (!existsStatus) {
      throw new RecordStoreFailedException('Invalid status');
    }

    const existsPaymentStatus = OrderService.paymentStatuses.some(
      (statusItem) => statusItem.id === record.paymentStatus,
    );

    if (!existsPaymentStatus) {
      throw new RecordStoreFailedException('Invalid payment status');
    }

    const existsShippingStatus = OrderService.shippingStatuses.some(
      (statusItem) => statusItem.id === record.shippingStatus,
    );

    if (!existsShippingStatus) {
      throw new RecordStoreFailedException('Invalid shipping status');
    }

    const orderId = v4();
    record.orderId = orderId;
    record.VAT = OrderService.VAT;

    const r = await super.store(record, userId, relationships);
    this.eventEmitter.emit('order.completed', r);

    return r;
  }

  async update(uuid: string, record: OrderModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }

  async processStoreOrder(order: ICheckoutStore) {
    // validate shipping information
    const shippingAddressValidation = AddressService.validateAddress(order.shippingInformation);
    if (!shippingAddressValidation.success) {
      throw new InvalidOrderException('INVALID_SHIPPING_ADDRESS','700.1', shippingAddressValidation.errors as any);
    }
    // validate billing information
    const billingAddressValidation = AddressService.validateAddress(order.billingInformation);
    if (!billingAddressValidation.success) {
      throw new InvalidOrderException('INVALID_BILLING_ADDRESS','700.2', billingAddressValidation.errors as any);
    }
    // validate contact information
    const contactInformationValidation = AddressService.validateContactInformation(order.contactInformation);
    if (!contactInformationValidation.success) {
      throw new InvalidOrderException('INVALID_CONTACT_INFORMATION','700.3', contactInformationValidation.errors as any);
    }
    // validate payment method
    const paymentMethod = await this.validateStorePaymentMethod(order.paymentMethod);
    // validate shipping method
    const shippingMethod = await this.validateStoreShippingMethod(order.shippingMethod);

    return {
      paymentMethod,
      shippingMethod
    }
  }


  async validateStorePaymentMethod(paymentMethod: IPaymentMethod) {
    if (!paymentMethod){
      throw new InvalidOrderException('INVALID_PAYMENT_METHOD', '700.4');
    }

    const found = await (new PaymentMethodService()).findOne({uuid: paymentMethod.uuid});
    if (!found){
      throw new InvalidOrderException('INVALID_PAYMENT_METHOD', '700.4' );
    }

    return found;
  }

  async validateStoreShippingMethod(shippingMethod: IShippingMethod) {
    if (!shippingMethod){
      throw new InvalidOrderException('INVALID_SHIPPING_METHOD', '700.5');
    }

    const found = await (new ShippingMethodService()).findOne({uuid: shippingMethod.uuid});
    if (!found){
      throw new InvalidOrderException('INVALID_SHIPPING_METHOD', '700.5');
    }

    return found;
  }
}
