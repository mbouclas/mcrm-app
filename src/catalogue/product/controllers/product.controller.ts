import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ProductService } from '~catalogue/product/services/product.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';

@Controller('api/product')
export class ProductController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ProductService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Patch('/basic')
  async storeBasic(@Body() body: IGenericObject) {
    return await new ProductService().store(body);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ProductService().findOne({ uuid }, rels);
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    const userId = session.user && session.user['uuid'];

    return await new ProductService().delete(uuid, userId);
  }

  @Post(':uuid/generate-variants')
  async generateVariants(@Session() session: SessionData, @Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const userId = session.user && session.user['uuid'];
    const propertyValues = body['propertyValues'];
    if (!propertyValues || !propertyValues.length) {
      return { success: false };
    }

    try {
      await new ProductService().generateVariantsFromProperty(uuid, propertyValues);
      return { success: true };
    } catch (e) {
      return {
        success: false,
        message: 'Error generating product variants',
        error: e.getMessage(),
        errors: e.getErrors(),
        code: e.getCode(),
      };
    }
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    const product = await new ProductService().store(body);

    return { success: true };
  }

  @Post(':uuid/attach')
  async addToProduct(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const relationships = store.getState().models['Product'].modelConfig.relationships;

    const targetRelationship = relationships[body.targetModel];
    if (!targetRelationship) {
      throw new RecordStoreFailedException('Invalid target model');
    }

    const response = await new ProductService().attachToModelById(uuid, body.targetId, targetRelationship.modelAlias);

    return response;
  }

  @Patch('/:uuid/productCategories')
  async updateProductCategories(@Param('uuid') uuid: string, @Body() ids: IGenericObject[]) {
    try {
      await new ProductService().updateProductCategories(uuid, ids.map((i) => i['uuid']));
      return { success: true };
    }
    catch (e) {
      return { success: false, error: e.message };
    }
  }
}
