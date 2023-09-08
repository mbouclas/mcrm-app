import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ConditionService } from '~setting/condition/services/condition.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { FailedCreate, FailedUpdate, FailedDelete, NotFound } from '../exceptions';

@Controller('api/condition')
export class ConditionController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ConditionService().find(
      queryParams,
      Array.isArray(queryParams['with']) ? queryParams['with'] : [],
    );
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ConditionService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new ConditionService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    try {
      const rels = [];

      const condition = await new ConditionService().store(body, null, rels);

      return condition;
    } catch (e) {
      console.log(e);
      throw new FailedCreate();
    }
  }

  @Patch(':uuid')
  async patch(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      const rels = [];

      await new ConditionService().update(uuid, body, null, rels, { clearExistingRelationships: true });

      return { success: true };
    } catch (e) {
      throw new FailedUpdate();
    }
  }
}
