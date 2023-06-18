import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { getStoreProperty, store } from "~root/state";
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerModel } from '~eshop/customer/models/customer.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from '~models/general';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';


export class CustomerModelDto {
  userId?: string;
  email?: string;
  provider?: string;
}

@Injectable()
export class CustomerService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  protected eventEmitter: EventEmitter2;


  constructor() {
    super();
    this.model = store.getState().models.Customer;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

  }


  async findOne(filter: IGenericObject, rels = []): Promise<CustomerModel> {
    const item = (await super.findOne(
      filter,
      rels,
    )) as unknown as CustomerModel;
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

  async store(record: CustomerModelDto, userId?: string) {
    const paymentProviderContainer = McmsDiContainer.get({
      id: `${
        record.provider.charAt(0).toUpperCase() + record.provider.slice(1)
      }Provider`,
    });

    const paymentMethodProvider: IPaymentMethodProvider =
      new paymentProviderContainer.reference();

    const providerCustomerId = await paymentMethodProvider.createCustomer(
      record.email,
    );
    const r = await super.store(
      {
        userId: record.userId,
        provider: record.provider,
        customerId: providerCustomerId,
      },
      userId,
    );

    return r;
  }

  async update(uuid: string, record: CustomerModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
