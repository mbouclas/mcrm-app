import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Session } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { AddressService } from '~eshop/address/services/address.service';
import { SessionData } from 'express-session';
import { IAddress } from '~root/eshop/models/checkout';
import { IsNotEmpty } from 'class-validator';

export class AddressPostDto {
  @IsNotEmpty()
  address: IAddress;

  @IsNotEmpty()
  userId: string;
}

@Controller('api/address')
export class AddressController {
  constructor() {}

  @Get()
  async find(@Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new AddressService().find(queryParams, rels);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new AddressService().findOne({ uuid }, rels);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    try {
      return await new AddressService().update(uuid, { ...body });
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Post()
  async addAddress(@Body() data: AddressPostDto) {
    if (!AddressService.validateAddress(data.address)) {
      return { success: false, message: 'Invalid address' };
    }

    try {
      const res = await new AddressService().attachAddressToUser(data.address, data.userId);
      data['uuid'] = res.uuid;
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }

    return data;
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new AddressService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
