import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentMethodModel } from '~eshop/payment-method/models/payment-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';

export class PaymentModelDto {
  title?: string;
  description?: string;
  status?: boolean;
  logo?: string;
  surcharge?: number;
  surcharge_type?: string;
  settings?: unknown;
}

@Injectable()
export class PaymentMethodService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.Payment;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() { }

  async findOne(filter: IGenericObject, rels = []): Promise<PaymentMethodModel> {
    const item = (await super.findOne(filter, rels)) as unknown as PaymentMethodModel;
    return item;
  }

  async store(record: PaymentModelDto, userId?: string) {
    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid: string, record: PaymentModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
