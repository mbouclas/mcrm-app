import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { PageCategoryService } from '~cms/page/services/page-category.service';
import { DeleteType } from '~root/shared/services/base-neo-tree.service';
import { NotFound, FailedCreate, FailedDelete, FailedMove, FailedUpdate } from '../exceptions/pageCategoryExceptions';

@Controller('api/page-category')
export class PageCategoryController {
  constructor() {}

  @Get('tree')
  async tree() {
    try {
      return await new PageCategoryService().toTree();
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new PageCategoryService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(`:id/move`)
  async move(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      const parentFilter = body.newParentUuid ? { uuid: body.newParentUuid } : null;

      await new PageCategoryService().moveNode(
        {
          uuid,
        },
        parentFilter,
      );

      return await new PageCategoryService().toTree();
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
      await new PageCategoryService().store(body, null, rels);

      return await new PageCategoryService().toTree();
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':id')
  async update(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      await new PageCategoryService().update(uuid, body, null);

      return await new PageCategoryService().toTree();
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @Delete(':id')
  async delete(@Param('id') uuid: string, @Query() queryParams) {
    try {
      const deleteType = DeleteType[queryParams.deleteType as keyof typeof DeleteType];

      await new PageCategoryService().deleteNode(uuid, deleteType);

      return await new PageCategoryService().toTree();
    } catch (e) {
      throw new FailedDelete();
    }
  }
}
