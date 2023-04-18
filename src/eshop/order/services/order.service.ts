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
  async onAppLoaded() { }

  async findOne(filter: IGenericObject, rels = []): Promise<OrderModel> {
    const item = (await super.findOne(filter, rels)) as unknown as OrderModel;
    return item;
  }

  async findAll(
    filter: IGenericObject,
    rels = [],
  ): Promise<IPagination<IGenericObject>> {
    const items = (await super.find(
      filter,
      rels,
    )) as IPagination<IGenericObject>;

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

  async store(record: OrderModelDto, userId?: string) {
    const existsStatus = OrderService.statuses.some(
      (statusItem) => statusItem.id === record.status,
    );

    if (!existsStatus) {
      throw new RecordStoreFailedException('Invalid status');
    }

    const existsPaymentStatus = OrderService.paymentStatuses.some(
      (statusItem) => statusItem.id === record.paymentStatus,
    );

    if (!existsPaymentStatus) {
      throw new RecordStoreFailedException('Invalid status');
    }

    const existsShippingStatus = OrderService.shippingStatuses.some(
      (statusItem) => statusItem.id === record.shippingStatus,
    );

    if (!existsShippingStatus) {
      throw new RecordStoreFailedException('Invalid status');
    }

    const orderId = v4();
    record.orderId = orderId;
    record.VAT = OrderService.VAT;

    const r = await super.store(record, userId);
    this.eventEmitter.emit('order.completed', r);

    return r;
  }

  async update(uuid: string, record: OrderModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
