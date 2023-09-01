import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { NotFound, FailedUpdate, FailedCreate, FailedDelete } from '../exceptions/productVariantExceptions';

@Controller('api/product-variant')
export class ProductVariantController {
  constructor() { }

  @Get('')
  async find(@Query() queryParams = {}) {
    try {
      return await new ProductVariantService().find(
        queryParams,
        Array.isArray(queryParams['with']) ? queryParams['with'] : [],
      );
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ProductVariantService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new ProductVariantService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }

  @Post('')
  async create(@Body() body: IGenericObject) {
    try {
      const variant = await new ProductVariantService().store(body);

      return variant;
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(`:uuid`)
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      const variant = await new ProductVariantService().update(uuid, body);

      return variant;
    } catch (e) {
      throw new FailedUpdate();
    }
  }
}
