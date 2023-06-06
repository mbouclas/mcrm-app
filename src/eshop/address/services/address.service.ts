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
import { IAddress } from "~eshop/models/checkout";
import { InvalidAddressException } from "~eshop/address/exceptions/invalid-address.exception";
import { BaseModel } from "~models/base.model";
import { UserModel } from "~user/models/user.model";

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
  static availableTypes = ['SHIPPING', 'BILLING', 'OTHER'];

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

    await new UserService().attachToModelById(userId, r.uuid, 'address',  {type: record.type});

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
    if (address.uuid) {
      return {success: true};
    }

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

  async attachAddressToUser(address: IAddress, userId: string, type: 'SHIPPING'|'BILLING'|'OTHER' = 'SHIPPING') {
    const validator = AddressService.validateAddress(address);
    if (!validator.success) {
      throw new InvalidAddressException('INVALID_ADDRESS', '600.1', validator.errors);
    }

    address.type = type;

    const user = await new UserService().findOne({uuid: userId}, ['address']);


    if (!Array.isArray(user.address) || user.address.length === 0) {
      // add a new address
      try {
        return await this.store(address, user.uuid);
      }
      catch (e) {
        console.log(e)
        throw new RecordStoreFailedException('Failed to store address', '600.2', e);
      }
    }

    const query = `
    MATCH (n:Address) WHERE n.uuid IN $uuids
    OPTIONAL MATCH (n)<-[r:HAS_ADDRESS]-(u:User) WHERE u.uuid = $userId
    return n as address, r as rel, u as user;
    `;

    const res = await this.neo.readWithCleanUp(query, {uuids: user.address.map(a => a['uuid']), userId});
    const existingAddresses = res.map(r => ({...r.address, type: r.rel.type}));

    // There's no good way to figure out if this address is indeed new or not, so we'll try to match some fields and go for it
    const found = existingAddresses.find(a => {
      return a.street === address.street && a.city === address.city && a.country === address.country && a.postCode === address.postCode;
    });

    if (found && found.type !== type) {
      // update the address just in case some extra info came through
      await this.update(found['uuid'], address);
      // add a new relationship for this type

      const res = await this.neo.writeWithCleanUp(`
      MATCH (n:Address) WHERE n.uuid = $addressUuid
      MATCH (u:User) WHERE u.uuid = $userId
      MERGE (u)-[r:HAS_ADDRESS {type: $type}]->(n)
      ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime() ,  r.type = $type
      ON MATCH SET r.updatedAt = datetime()
      return n as address
      `, {
        addressUuid: found['uuid'],
        userId,
        type
      });
      return res[0]['address'];
    }

    if (found && found.type === type) {
      // update the address just in case some extra info came through
      return await this.update(found['uuid'], address);
    }

    // add a new address
    try {
      return await this.store(address, user.uuid);
    }
    catch (e) {
      console.log(e)
      throw new RecordStoreFailedException('Failed to store address', '600.2', e);
    }
  }
}
