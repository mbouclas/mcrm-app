import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { getStoreProperty, store } from "~root/state";
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerModel } from '~eshop/customer/models/customer.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject, IPagination } from '~models/general';
import { McmsDiContainer } from '../../../helpers/mcms-component.decorator';
import { IPaymentMethodProvider } from '~eshop/payment-method/models/providers.types';
import { UserModel } from "~user/models/user.model";
import { AuthService } from "~root/auth/auth.service";
import { UserService } from "~user/services/user.service";
import { RoleModel } from "~user/role/models/role.model";
import { RoleService } from "~user/role/services/role.service";
import { UserExistsException } from "~user/exceptions/user-exists.exception";
import { UserGroupService } from "~eshop/user-group/user-group.service";
import { UserGroupModel } from "~eshop/user-group/user-group.model";
import { IAddress } from '~root/eshop/models/checkout';
import { randomStringGenerator } from "@nestjs/common/utils/random-string-generator.util";
import { tokenGenerator } from "~helpers/tokenGenerator";
import { AddressService } from "~eshop/address/services/address.service";

const crypto = require("crypto");

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

  async createCustomer(customer: Partial<UserModel>, role?: string, sendNotificationOnCreate = true) {
    const authService = new AuthService();
    if (!customer.password) {
      customer.password = tokenGenerator();
    }
    const hashedPassword = await authService.hasher.hashPassword(customer.password);
    const userService = new UserService();
    let found;
    try {
      found = await userService.findOne({email: customer.email});
    }
    catch (e) {

    }

    if (found) {
      throw new UserExistsException('USER_EXISTS', '9005.1', {email: customer.email});
    }

    const confirmToken = crypto
      .createHash("sha256")
      .update(customer.email)
      .digest("hex");

    let user;

    try {

    user = await userService.store({
      ...customer,
      password: hashedPassword,
      confirmToken,
      type: "guest",
      active: customer['active'] || false
    }, undefined, [], sendNotificationOnCreate);


  } catch (e) {
    return {
      success: false,
      message: "Failed to register user",
      reason: e.message
    };
  }

  // attach user to default role
    const defaultRole = getStoreProperty('configs.store.users.newUserDefaultRole');
    let roleToApply: Partial<RoleModel>;
    if (role) {
      roleToApply = await new RoleService().findOne({name: role});
    }

    try {
      await userService.attachModelToAnotherModel(UserModel,RoleModel, {uuid: user.uuid}, {name: roleToApply ? roleToApply.name : defaultRole.name}, 'role');
    }
    catch (e) {
      console.log(e)
    }

    // add address to user
    if (customer.address) {
    }

    const defaultUserGroup = await new UserGroupService().getDefaultGroup();

    if (defaultUserGroup || Array.isArray(customer.userGroup)) {
      const groups = Array.isArray(customer.userGroup) ? customer.userGroup : [defaultUserGroup['uuid']];
      try {
        await new UserService().assignUserGroup(user.uuid, groups as Partial<UserGroupModel>[]);
      }
      catch (e) {
        console.log(`Error assigning user to groups: ${e.message}`, e);
      }
    }

    return user;
  }

  async createCustomerFromGuest(email: string, address: IAddress) {
    let user;
    // try to find the user in case of a returning guest
    try {
      user = await (new UserService()).findOne({ email });

      return user;
    }
    catch (e) {

    }

    try {
      console.log('1111111111111')
      user = await this.createCustomer({
        email,
        firstName: address.firstName,
        lastName: address.lastName
      }, null, false);

    }
    catch (e) {
      console.log(`Error creating customer: ${e.message}`, e);
    }

    try {

      await (new AddressService()).attachAddressToUser(address, user.uuid, address.type.toUpperCase() as unknown as any);
    }
     catch (e) {
      console.log(`Error attaching address to user: ${e.message}`, e);
     }


     return user;
  }
}
