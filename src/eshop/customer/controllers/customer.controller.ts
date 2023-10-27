import { Body, Controller, Get, Param, Patch, Post, Query, Req, Session, UseInterceptors } from "@nestjs/common";
import { UserService } from '~user/services/user.service';
import { IGenericObject } from '~root/models/general';
import { FailedUpdate, NotFound } from '../exceptions';
import { IsNotEmpty, IsOptional } from "class-validator";
import { IAddress } from "~eshop/models/checkout";
import { AddressService } from "~eshop/address/services/address.service";
import { RoleModel } from "~user/role/models/role.model";
import { CustomerService } from "~eshop/customer/services/customer.service";
import { UserModel } from "~user/models/user.model";
import BaseHttpException from "~shared/exceptions/base-http-exception";
import { SanitizeUserForApiInterceptor } from "~user/interceptors/sanitize-user-for-api.interceptor";

export class AddressSyncDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  address: IAddress;

  @IsNotEmpty()
  type: 'SHIPPING'|'BILLING' | 'OTHER'
}


class PostedCustomerDto {
  @IsNotEmpty()
  user: Partial<UserModel>

  @IsOptional()
  role: string

}

@Controller('api/customer')
export class CustomerController {
  @Get('')
  @UseInterceptors(SanitizeUserForApiInterceptor)
  async find(@Query() queryParams = {}) {

    try {
      return await new UserService().find(queryParams, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
  @UseInterceptors(SanitizeUserForApiInterceptor)
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new UserService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      return await new UserService().update(uuid, body);
    } catch (e) {
      throw new FailedUpdate();
    }
  }


  @Post("/address/sync")
  async syncAddress(@Body() data: AddressSyncDto) {
    if (!AddressService.validateAddress(data.address)) {
      return {success: false, message: "Invalid address"};
    }

    try {
      const res = await (new AddressService()).attachAddressToUser(data.address, data.userId, data.type.toUpperCase() as unknown as any);
      data['uuid'] = res.uuid;
    }
    catch (e) {
      console.log(e)
      return {success: false, message: e.message, code: e.getCode()};
    }


    return data;
  }

  @Post("create")
  async create(@Body() body: PostedCustomerDto) {
    const customerService = new CustomerService();

    try {
      return await customerService.createCustomer(body.user, body.role);
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage() || e.message,
        reason: 'Validation errors',
        code: e.getCode() || 'CUSTOMER_CREATE_FAILED',
        statusCode: 500,
        validationErrors: e.getErrors() || e,
      })
    }
  }
}
