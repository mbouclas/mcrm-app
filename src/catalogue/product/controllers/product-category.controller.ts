import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';
import { DeleteType } from '~root/shared/services/base-neo-tree.service';

@Controller('api/product-category')
export class ProductCategoryController {
  constructor() { }

  @Get('tree')
  async tree() {
    return await new ProductCategoryService().toTree();
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) { }

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
      console.log(e);
      return false;
    }
  }

  @Post()
  async create(@Body() body: IGenericObject) {
    await new ProductCategoryService().store(body, null, [
      {
        id: body.parentUuid,
        name: 'parent',
      },
    ]);

    return await new ProductCategoryService().toTree();
  }

  @Delete(':id')
  async delete(@Param('id') uuid: string, @Query() queryParams) {
    try {
      const deleteType = DeleteType[queryParams.deleteType as keyof typeof DeleteType];

      await new ProductCategoryService().deleteNode(uuid, deleteType);

      return await new ProductCategoryService().toTree();
    } catch (e) {
      return false;
    }
  }
}
