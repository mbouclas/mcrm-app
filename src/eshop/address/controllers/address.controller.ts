import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { AddressService } from '~eshop/address/services/address.service';
import { SessionData } from 'express-session';

@Controller('api/address')
export class AddressController {
  constructor() {}

  @Get()
  async find(@Session() session: SessionData, @Query() queryParams = {}) {
    const userId = session.user && session.user['uuid'];
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new AddressService().find({ userId }, rels);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new AddressService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(
    @Session() session: SessionData,
    @Param('uuid') uuid: string,
    @Body() body: IGenericObject,
  ) {
    const userId = session.user && session.user['uuid'];

    return await new AddressService().update(uuid, { ...body, userId });
  }

  @Post()
  async store(@Session() session: SessionData, @Body() body: IGenericObject) {
    const userId = session.user && session.user['uuid'];
    return await new AddressService().store({ ...body, userId });
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    return await new AddressService().delete(uuid);
  }
}
