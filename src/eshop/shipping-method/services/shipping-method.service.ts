import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { ShippingMethodModel } from '~eshop/shipping-method/models/shipping-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';
import { IShippingMethodProvider } from '~eshop/shipping-method/models/providers.types';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';

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
  providerName?: string;
  settingsFields?: unknown;
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

  async findOne(filter: IGenericObject, rels = []): Promise<ShippingMethodModel> {
    const item = (await super.findOne(filter, rels)) as unknown as ShippingMethodModel;
    return item;
  }



  async update(uuid: string, record: ShippingModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
