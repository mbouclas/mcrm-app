import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AddressModel } from '~eshop/address/models/address.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';
import { SharedModule } from '~shared/shared.module';
import { UserService } from '~root/user/services/user.service';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { boolean, object, string } from "yup";
import { extractValidationErrors } from "~helpers/validation";

export class AddressModelDto {
  userId?: string;
  tempUuid?: string;
  uuid?: string;
  type?: string;
  city?: string;
  country?: string;
  street?: string;
  zipcode?: string;
  note?: string;
}

@Injectable()
export class AddressService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  protected eventEmitter: EventEmitter2;
  static availableTypes = ['SHIPPING', 'BILLING'];

  constructor() {
    super();
    this.model = store.getState().models.Address;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<AddressModel> {
    const item = (await super.findOne(filter, rels)) as unknown as AddressModel;
    return item;
  }

  async store(record: AddressModelDto, userId?: string) {
    if (!AddressService.availableTypes.includes(record.type)) {
      throw new RecordStoreFailedException('Invalid type');
    }
    const r = await super.store(record, userId);

    await new UserService().attachToModelById(userId, r.uuid, 'address');

    return r;
  }

  async update(uuid: string, record: AddressModelDto, userId?: string) {
    if (!AddressService.availableTypes.includes(record.type)) {
      throw new RecordStoreFailedException('Invalid type');
    }

    const r = await super.update(uuid, record, userId);

    return r;
  }

  static validateAddress(address: AddressModelDto) {
    const schema = object({
      firstName: string().required(),
      lastName: string().required(),
      street: string().required(),
      city: string().required(),
      company: string().required(),
      country: string().required(),
      region: string().required(),
      postCode: string().required(),
      phone: string().required(),
    });

    try {
      schema.validateSync(address, { abortEarly: false });
    }
    catch (e) {
      return {success: false, errors: extractValidationErrors(e)};
    }

    return {success: true};
  }

  static validateContactInformation(info) {
    const schema = object({
      email: string().email("Email doesn't look right").required('Please provide your email'),
      phone: string().required(),
      firstName: string().required(),
      lastName: string().required(),
      terms: boolean().oneOf([true]),
    });

    try {
      schema.validateSync(info, { abortEarly: false });
    }
    catch (e) {
      return {success: false, errors: extractValidationErrors(e)};
    }

    return {success: true};
  }
}
