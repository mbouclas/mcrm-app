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
    const { providerName, settingsFields, ...rest } = record;
    const settingsFieldKeys = Object.keys(settingsFields);

    const providerContainer = McmsDiContainer.get({
      id: `${
        providerName.charAt(0).toUpperCase() + providerName.slice(1)
      }Provider`,
    });

    const provider: IShippingMethodProvider = new providerContainer.reference();

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
    return { ...r, providerSettings: JSON.parse(providerSettings) };
  }

  async update(uuid: string, record: ShippingModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
