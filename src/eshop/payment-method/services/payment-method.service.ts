import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentMethodModel } from '~eshop/payment-method/models/payment-method.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from "~models/general";
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';
import { zodToJsonSchema } from "zod-to-json-schema";

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

    item.provider = this.getProvider(item.providerName);
    return item;
  }

  async find(params: IGenericObject = {}, rels: string[] = []) {
    let res: IPagination<PaymentMethodModel>;
    try {
      res = await super.find(params, rels) as IPagination<PaymentMethodModel>;
    } catch (e) {
      throw e;
    }

    // get the provider for each one
    if (Array.isArray(res.data) && res.data.length > 0) {
      res.data.forEach((item) => {
        item.provider = this.getProvider(item.providerName);
      });
    }

    return res;
  }

/*  async store(record: PaymentModelDto, userId?: string) {
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
    return { ...r, providerSettings: JSON.parse(providerSettings) };
  }*/


  getProvider(providerName: string) {
    const found = McmsDiContainer.findOne({id: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)}Provider`});

    if (!found) {return null;}

    return found.reference;
  }

  getProviders(formatted = false) {
    if (!formatted) {
      return McmsDiContainer.filter({type: 'paymentMethodProvider'});
    }

    return McmsDiContainer.filter({type: 'paymentMethodProvider'}).map((provider) => {
      return PaymentMethodService.getProviderForApiUse(provider.id, false) as unknown as IPaymentMethodProvider
    });
  }


  static getProviderForApiUse(providerName: string, convertId = true) {
    const id = convertId ? `${providerName.charAt(0).toUpperCase() + providerName.slice(1)}Provider` : providerName;
    const provider = McmsDiContainer.findOne({id});
    if (!provider) {return null;}
    const shortName = provider.id.replace('Provider', '').toLowerCase();

    return {
      ...provider.reference.metaData,
      ...{shortName},
      settingsSchema: provider.reference['settingsSchema'] ? zodToJsonSchema(provider.reference['settingsSchema']) : {},
    }

  }
}
