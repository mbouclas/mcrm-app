import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderModel } from '~eshop/order/models/order.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { v4 } from 'uuid';

export class OrderModelDto {
  orderId?: string;
  tempUuid?: string;
  uuid?: string;
  total?: number;
  shippingMethod?: string;
  paymentMethod?: string;
  notes?: string;
  status?: number;
}

@Injectable()
export class OrderService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  statuses: { id: number; label: string }[];

  constructor() {
    super();
    this.model = store.getState().models.Order;

    this.changeLog = new ChangeLogService();

    this.statuses = [
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
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<OrderModel> {
    const item = (await super.findOne(filter, rels)) as unknown as OrderModel;
    return item;
  }

  async store(record: OrderModelDto, userId?: string) {
    const existsStatus = this.statuses.some(
      (statusItem) => statusItem.id === record.status,
    );

    if (!existsStatus) {
      throw new RecordStoreFailedException('Invalid status');
    }

    const orderId = v4();
    record.orderId = orderId;

    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid: string, record: OrderModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
