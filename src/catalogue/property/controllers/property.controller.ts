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

  @Get('/variant/:uuid')
  async findValueByVariant(@Param('uuid') uuid: string) {
    return await new PropertyValueService().findByVariantId(uuid);
  }

  @Get('/value/search')
  async searchValue(@Query() queryParams = {}) {
    const q = queryParams['q'] || '';
    return await new PropertyValueService().searchValues(q);
  }

  @Get('/value')
  async findValues(@Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PropertyValueService().find(queryParams, rels);
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
    await new PropertyService().store(body, null, []);

    return { success: true };
  }

  @Patch(':uuid')
  async patch(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const service = new PropertyService();
    await service.update(uuid, body, null);

    return { success: true };
  }

  @Patch('/:uuid/value/:propertyValueUuid')
  async patchValue(@Param('propertyValueUuid') propertyUuid: string, @Body() body: IGenericObject) {
    await new PropertyValueService().update(propertyUuid, body);
    return { success: true };
  }

  @Delete('/:uuid/value/:propertyValueUuid')
  async deleteValue(@Param('propertyValueUuid') propertyUuid: string) {
    await new PropertyValueService().delete(propertyUuid);
    return { success: true };
  }

  @Post('/:uuid/value')
  async addValue(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const rels = [
      {
        id: uuid,
        name: 'property',
      },
    ];

    await new PropertyValueService().store(body, null, rels);
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
