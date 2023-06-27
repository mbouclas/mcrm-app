import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';

@Controller('api/product-variant')
export class ProductVariantController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ProductVariantService().find(
      queryParams,
      Array.isArray(queryParams['with']) ? queryParams['with'] : [],
    );
  }

  @Post('/basic')
  async storeBasic(@Body() body: IGenericObject) {
    return await new ProductVariantService().store(body);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ProductVariantService().findOne({ uuid }, rels);
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user['uuid'];

    return await new ProductVariantService().delete(uuid, userId);
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    const productVariant = await new ProductVariantService().store(body);

    return { success: true };
  }

  @Post(':uuid/attach')
  async addToProductVariant(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const relationships = store.getState().models['ProductVariant'].modelConfig.relationships;

    const targetRelationship = relationships[body.targetModel];
    if (!targetRelationship) {
      throw new RecordStoreFailedException('Invalid target model');
    }

    const response = await new ProductVariantService().attachToModelById(
      uuid,
      body.targetId,
      targetRelationship.modelAlias,
    );

    return response;
  }

  @Patch(`:uuid`)
  async update(@Session() session: SessionData, @Body() body: IGenericObject, @Param('uuid') uuid: string) {
    const variant = await new ProductVariantService().update(uuid, body);

    return variant;
  }
}
