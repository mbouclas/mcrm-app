import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Session } from "@nestjs/common";

import { IGenericObject } from "~models/general";
import { FailedCreate, FailedDelete, FailedToRelate, FailedUpdate, NotFound } from "~cms/page/exceptions";
import { SessionData } from "express-session";
import { BusinessService } from "~crm/services/business.service";

@Controller('api/business')
export class BusinessController {
  @Get('')
  async find(@Query() queryParams = {}) {
    return await new BusinessService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Patch('/basic')
  async storeBasic(@Body() body: IGenericObject) {
    return await new BusinessService().store(body);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new BusinessService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new BusinessService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }

  @Post('')
  async create(@Body() body: IGenericObject, @Session() session: SessionData) {
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

      if (body.owner) {

      } else {
        const userId = session.user && session.user['uuid'];
      }

      return await new BusinessService().store(body, null, rels);

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

      await new BusinessService().update(uuid, body, null, rels, { clearExistingRelationships: true });

      return { success: true };
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @Post('/manage-relate')
  async relatePage(@Body() body: IGenericObject) {
    try {
      for (const destinationUuid of body.destinationUuids) {
        await new BusinessService().findOne({ uuid: body.sourceUuid });
        await new BusinessService().findOne({ uuid: destinationUuid });

        if (body.type === 'relate') {
          await new BusinessService().attachToModelById(body.sourceUuid, destinationUuid, 'related');
        } else {
          await new BusinessService().detachFromModelById(body.sourceUuid, destinationUuid, 'related');
        }
      }

      return { success: true };
    } catch (e) {
      throw new FailedToRelate();
    }
  }
}
