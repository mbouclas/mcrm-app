import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { PageService } from '~cms/page/services/page.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { FailedCreate, FailedDelete, NotFound, FailedToRelate } from '../exceptions';

@Controller('api/page')
export class PageController {
  constructor() {}

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new PageService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Patch('/basic')
  async storeBasic(@Body() body: IGenericObject) {
    return await new PageService().store(body);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new PageService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new PageService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    try {
      await new PageService().store(body);

      return { success: true };
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Post('/manage-relate')
  async relatePage(@Body() body: IGenericObject) {
    try {
      for (const destinationUuid of body.destinationUuids) {
        await new PageService().findOne({ uuid: body.sourceUuid });
        await new PageService().findOne({ uuid: destinationUuid });

        if (body.type === 'relate') {
          await new PageService().attachToModelById(body.sourceUuid, destinationUuid, 'related');
        } else {
          await new PageService().detachFromModelById(body.sourceUuid, destinationUuid, 'related');
        }
      }

      return { success: true };
    } catch (e) {
      throw new FailedToRelate();
    }
  }
}
