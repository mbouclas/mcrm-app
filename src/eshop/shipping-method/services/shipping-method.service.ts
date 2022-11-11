import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { ShippingMethodModel } from '~eshop/shipping-method/models/shipping-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';

export class ShippingModelDto {
  title?: string;
  description?: string;
  shipping_time?: string;
  destination?: string;
  code?: string;
  parentId?: string;
  status?: boolean;
  weightMin?: number;
  weightLimit?: number;
  baseCost?: number;
  settings?: string;
}

@Injectable()
export class ShippingMethodService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.ShippingMethod;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(
    filter: IGenericObject,
    rels = [],
  ): Promise<ShippingMethodModel> {
    const item = (await super.findOne(
      filter,
      rels,
    )) as unknown as ShippingMethodModel;
    return item;
  }

  async store(record: ShippingModelDto, userId?: string) {
    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid: string, record: ShippingModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
