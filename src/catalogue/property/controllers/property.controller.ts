import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { PropertyService } from '~catalogue/property/services/property.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import { PropertyValueService } from '../services/propertyValue.service';

@Controller('api/property')
export class PropertyController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PropertyService().find(queryParams, rels);
  }

  @Post('/basic')
  async storeBasic(@Body() body: IGenericObject) {
    return await new PropertyService().store(body);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PropertyService().findOne({ uuid }, rels);
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user['uuid'];

    return await new PropertyService().delete(uuid, userId);
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    const propertyValues = body.propertyValue;

    let rels = [];
    await Promise.all(
      propertyValues.map(async (propertyValue) => {
        console.log('roperty value ', propertyValue);
        const propertyValueCreated = await new PropertyValueService().store(propertyValue);
        rels = [
          ...rels,
          {
            id: propertyValueCreated?.uuid,
            name: 'propertyValue',
          },
        ];
      }),
    );

    await new PropertyService().store(body, null, rels);

    return { success: true };
  }

  @Patch(':uuid')
  async patch(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const propertyValues = body.propertyValue;

    let rels = [];
    await Promise.all(
      propertyValues.map(async (propertyValue) => {
        const propertyValueCreated = await new PropertyValueService().update(propertyValue.uuid, propertyValue);
        rels = [
          ...rels,
          {
            id: propertyValueCreated?.uuid,
            name: 'propertyValue',
          },
        ];
      }),
    );

    await new PropertyService().update(uuid, body, null, rels);

    return { success: true };
  }

  @Post(':uuid/attach')
  async addToproperty(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const relationships = store.getState().models['property'].modelConfig.relationships;

    const targetRelationship = relationships[body.targetModel];
    if (!targetRelationship) {
      throw new RecordStoreFailedException('Invalid target model');
    }

    const response = await new PropertyService().attachToModelById(uuid, body.targetId, targetRelationship.modelAlias);

    return response;
  }
}
