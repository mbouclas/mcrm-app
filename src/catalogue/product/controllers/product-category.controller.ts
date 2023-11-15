import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';
import { TreeDeleteType } from '~root/shared/services/base-neo-tree.service';
import {
  NotFound,
  FailedCreate,
  FailedDelete,
  FailedMove,
  FailedUpdate,
} from '../exceptions/productCategoryExceptions';

@Controller('api/product-category')
export class ProductCategoryController {
  constructor() { }

  @Get('tree')
  async tree() {
    try {
      return await new ProductCategoryService().toTree();
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ProductCategoryService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(`:id/move`)
  async move(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      const parentFilter = body.newParentUuid ? { uuid: body.newParentUuid } : null;

      await new ProductCategoryService().moveNode(
        {
          uuid,
        },
        parentFilter,
      );

      return await new ProductCategoryService().toTree();
    } catch (e) {
      throw new FailedMove();
    }
  }

  @Post()
  async create(@Body() body: IGenericObject) {
    try {
      let rels = [];

      if (body.parentUuid) {
        rels = [
          {
            id: body.parentUuid,
            name: 'parent',
          },
        ];
      }
      await new ProductCategoryService().store(body, null, rels);

      return await new ProductCategoryService().toTree();
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':id')
  async update(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      await new ProductCategoryService().update(uuid, body, null);

      return await new ProductCategoryService().toTree();
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @Delete(':id')
  async delete(@Param('id') uuid: string, @Query() queryParams) {
    try {
      const deleteType = TreeDeleteType[queryParams.deleteType as keyof typeof TreeDeleteType];

      await new ProductCategoryService().deleteNode(uuid, deleteType);

      return await new ProductCategoryService().toTree();
    } catch (e) {
      throw new FailedDelete();
    }
  }
}
