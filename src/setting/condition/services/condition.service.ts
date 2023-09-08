import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';
import { ConditionRule } from '~root/eshop/cart/ConditionRule';

export class ConditionModelDto {
  tempUuid?: string;
  uuid?: string;

  name: string;
  type: 'tax' | 'shipping' | 'coupon';
  target: 'subtotal' | 'price' | 'total' | 'quantity' | 'numberOfItems' | 'item';
  value: string;
  order?: number;
  attributes?: IGenericObject;
  rules?: ConditionRule[];
}

@Injectable()
export class ConditionService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'condition.model.updated';
  static createdEventName = 'condition.model.created';
  static deletedEventName = 'condition.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.CartCondition;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}
}
