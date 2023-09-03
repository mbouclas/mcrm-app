import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { PageService } from '~cms/page/services/page.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { FailedCreate, FailedUpdate, FailedDelete, NotFound, FailedToRelate } from '../exceptions';

@Controller('api/page')
export class PageController {
  constructor() { }

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
      const rels = [];

      if (body.pageCategory) {
        for (const category of body.pageCategory) {
          rels.push({
            id: category.uuid,
            name: 'pageCategory',
          });
        }
      }

      if (body.tag) {
        for (const tag of body.tag) {
          rels.push({
            id: tag.uuid,
            name: 'tag',
          });
        }
      }

      const page = await new PageService().store(
        {
          ...body,
          thumb: JSON.stringify(body.thumb),
        },
        null,
        rels,
      );

      return page;
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':uuid')
  async patch(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      const rels = [];

      if (body.pageCategory) {
        for (const category of body.pageCategory) {
          rels.push({
            id: category.uuid,
            name: 'pageCategory',
          });
        }
      }

      if (body.tag) {
        for (const tag of body.tag) {
          rels.push({
            id: tag.uuid,
            name: 'tag',
          });
        }
      }

      await new PageService().update(uuid, body, null, rels, { clearExistingRelationships: true });

      return { success: true };
    } catch (e) {
      console.log(e);
      throw new FailedUpdate();
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
