import {
  Body,
  Controller,
  Post,
  Session,
  Get,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ProductService } from '~catalogue/product/services/product.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';

@Controller('api/product')
export class ProductController {
  constructor() {}

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ProductService().find(
      queryParams,
      Array.isArray(queryParams['with']) ? queryParams['with'] : [],
    );
  }

  @Post('/basic')
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
    const userId = session.user && session.user.user['uuid'];

    return await new ProductService().delete(uuid, userId);
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    const product = await new ProductService().store(body);

    return { success: true };
  }

  @Post(':uuid/attach')
  async addToProduct(
    @Param('uuid') uuid: string,
    @Body() body: IGenericObject,
  ) {
    const relationships =
      store.getState().models['Product'].modelConfig.relationships;

    const targetRelationship = relationships[body.targetModel];
    if (!targetRelationship) {
      throw new RecordStoreFailedException('Invalid target model');
    }

    const response = await new ProductService().attachModelToAnotherModel(
      store.getState().models['Product'],
      {
        uuid,
      },
      store.getState().models[targetRelationship.model],
      {
        uuid: body.targetId,
      },
      targetRelationship.modelAlias,
    );

    return response;
  }
}
