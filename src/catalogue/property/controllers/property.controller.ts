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
    const newPropertyValues = body.propertyValue;

    const propertyValue = await new PropertyService().getPropertyWithValues({ uuid });

    const existingUUIDs = propertyValue.values.map((value) => (value as any).uuid);

    const uuidsToDelete = existingUUIDs.filter((uuid) => !newPropertyValues.some((newVal) => newVal.uuid === uuid));

    await Promise.all(uuidsToDelete.map((uuid) => new PropertyValueService().delete(uuid)));

    let rels = [];
    await Promise.all(
      newPropertyValues.map(async (newPropertyValue) => {
        const exists = propertyValue.values.some(
          (existingPropertyValue) => existingPropertyValue.uuid === newPropertyValue.uuid,
        );
        let valueUuid: string;

        if (exists) {
          await new PropertyValueService().update(newPropertyValue.uuid, newPropertyValue);
          valueUuid = newPropertyValue.uuid;
        }

        if (!exists) {
          const newPropertyValueCreated = await new PropertyValueService().store(newPropertyValue);
          valueUuid = newPropertyValueCreated.uuid;
        }

        rels = [
          ...rels,
          {
            id: valueUuid,
            name: 'propertyValue',
          },
        ];
      }),
    );

    const service = new PropertyService();
    await service.update(uuid, body, null);
    await service.attachToManyById(uuid, rels);

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
