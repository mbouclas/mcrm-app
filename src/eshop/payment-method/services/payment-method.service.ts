import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentMethodModel } from '~eshop/payment-method/models/payment-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';

export class PaymentModelDto {
  title?: string;
  description?: string;
  status?: boolean;
  logo?: string;
  surcharge?: number;
  surcharge_type?: string;
  settings?: unknown;
  providerName?: string;
  settingsFields?: unknown;
}

@Injectable()
export class PaymentMethodService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.PaymentMethod;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(
    filter: IGenericObject,
    rels = [],
  ): Promise<PaymentMethodModel> {
    const item = (await super.findOne(
      filter,
      rels,
    )) as unknown as PaymentMethodModel;
    return item;
  }

  async store(record: PaymentModelDto, userId?: string) {
    const { providerName, settingsFields, ...rest } = record;
    const settingsFieldKeys = Object.keys(settingsFields);

    const providerContainer = McmsDiContainer.get({
      id: `${
        providerName.charAt(0).toUpperCase() + providerName.slice(1)
      }Provider`,
    });

    const provider: IPaymentMethodProvider = new providerContainer.reference();

    const allowedSettingsFields = provider.getFields();

    const allowedSettingsKeys = allowedSettingsFields.map(
      (field) => field.varName,
    );

    const notAllowedFound = settingsFieldKeys.find(
      (settingsField) => !allowedSettingsKeys.includes(settingsField),
    );

    if (notAllowedFound) {
      throw new Error(`Unsupported key: ${notAllowedFound}`);
    }

    const providerSettings = JSON.stringify({
      providerName,
      settingsFields,
    });

    const r = await super.store(
      {
        ...rest,
        providerSettings,
      },
      userId,
    );
    return r;
  }

  async update(uuid: string, record: PaymentModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
