import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ImportTemplateService } from '~catalogue/import/services/import-template.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { FailedCreate, FailedDelete, FailedUpdate, NotFound } from '../exceptions';

@Controller('api/import-template')
export class ImportTemplateController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ImportTemplateService().find(
      queryParams,
      Array.isArray(queryParams['with']) ? queryParams['with'] : [],
    );
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ImportTemplateService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new ImportTemplateService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }
  @Post('')
  async create(@Body() body: IGenericObject) {
    try {
      const importTemplate = await new ImportTemplateService().store(body, null);

      return importTemplate;
    } catch (e) {
      console.log(e);
      throw new FailedCreate();
    }
  }

  @Patch(':uuid')
  async patch(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      await new ImportTemplateService().update(uuid, body, null);

      return { success: true };
    } catch (e) {
      throw new FailedUpdate();
    }
  }
}
