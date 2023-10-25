import { Body, Controller, Get, Param, Patch, Post, Query, Req, Session } from "@nestjs/common";
import { UserService } from '~user/services/user.service';
import { IGenericObject } from '~root/models/general';
import { FailedUpdate, NotFound } from '../exceptions';
import { IsNotEmpty } from "class-validator";
import { IAddress } from "~eshop/models/checkout";
import { AddressService } from "~eshop/address/services/address.service";

export class AddressSyncDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  address: IAddress;

  @IsNotEmpty()
  type: 'SHIPPING'|'BILLING' | 'OTHER'
}
@Controller('api/customer')
export class CustomerController {
  @Get('')
  async find(@Query() queryParams = {}) {

    try {
      return await new UserService().find(queryParams, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
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
}
