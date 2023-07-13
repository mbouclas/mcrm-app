import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';

@Controller('api/product-category')
export class ProductCategoryController {
  constructor() {}

  @Get('tree')
  async tree() {
    return await new ProductCategoryService().toTree();
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) {}

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
  async store(@Body() data: IGenericObject) {}

  @Delete()
  async delete(@Param('id') uuid: string) {}
}
