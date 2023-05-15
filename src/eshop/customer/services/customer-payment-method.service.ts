import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerPaymentMethodModel } from '~eshop/customer/models/customer-payment-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from '~models/general';

export class CustomerPaymentMethodModelDto {
  userId?: string;
  provider?: string;
  providerCustomerId?: string;
  providerPaymentMethodId?: string;
  paymentMethodId?: string;
  card?: {
    brand: string;
    last4: number;
    expiryMonth: number;
    expiryYear: number;
  };
}

@Injectable()
export class CustomerPaymentMethodService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  protected eventEmitter: EventEmitter2;

  constructor() {
    super();
    this.model = store.getState().models.CustomerPaymentMethod;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<CustomerPaymentMethodModel> {
    const item = (await super.findOne(filter, rels)) as unknown as CustomerPaymentMethodModel;
    return item;
  }

  async findAll(filter: IGenericObject, rels = []): Promise<IPagination<IGenericObject>> {
    const items = (await super.find(filter, rels)) as IPagination<IGenericObject>;

    return items;
  }

  async store(record: CustomerPaymentMethodModelDto, userId?: string) {
    const r = await super.store(
      {
        userId,
        provider: record.provider,
        providerCustomerId: record.providerCustomerId,
        providerPaymentMethodId: record.providerPaymentMethodId,
        cardBrand: record.card.brand,
        cardLast4: record.card.last4,
        cardExpiryMonth: record.card.expiryMonth,
        cardExpiryYear: record.card.expiryYear,
        paymentMethodId: record.paymentMethodId,
      },
      userId,
    );

    return r;
  }

  async update(uuid: string, record: CustomerPaymentMethodModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
