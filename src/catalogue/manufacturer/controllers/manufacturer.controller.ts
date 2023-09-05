import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ManufacturerService } from '~catalogue/manufacturer/services/manufacturer.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { FailedCreate, FailedDelete, FailedToAttach, FailedUpdate, NotFound } from '../exceptions';

@Controller('api/manufacturer')
export class ManufacturerController {
  constructor() {}

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ManufacturerService().find(
      queryParams,
      Array.isArray(queryParams['with']) ? queryParams['with'] : [],
    );
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ManufacturerService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new ManufacturerService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }
  @Post('')
  async create(@Body() body: IGenericObject) {
    try {
      const manufacturer = await new ManufacturerService().store(body, null);

      return manufacturer;
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':uuid')
  async patch(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      await new ManufacturerService().update(uuid, body, null);

      return { success: true };
    } catch (e) {
      throw new FailedUpdate();
    }
  }
}
