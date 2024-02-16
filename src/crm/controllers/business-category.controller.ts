import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  FailedCreate,
  FailedDelete,
  FailedMove,
  FailedUpdate,
  NotFound
} from "~cms/page/exceptions/pageCategoryExceptions";
import { BusinessCategoryService } from "~crm/services/business-category.service";
import { IGenericObject } from "~models/general";
import { TreeDeleteType } from "~shared/services/base-neo-tree.service";

@Controller('api/business-category')
export class BusinessCategoryController {
  @Get('tree')
  async tree() {
    try {
      return await new BusinessCategoryService().toTree();
    } catch (e) {
      console.log(e)
      throw new NotFound();
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new BusinessCategoryService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(`:id/move`)
  async move(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      const parentFilter = body.newParentUuid ? { uuid: body.newParentUuid } : null;

      await new BusinessCategoryService().moveNode(
        {
          uuid,
        },
        parentFilter,
      );

      return await new BusinessCategoryService().toTree();
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

      await new BusinessCategoryService().store(body, null, rels);

      return await new BusinessCategoryService().toTree();
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':id')
  async update(@Param('id') uuid: string, @Body() body: IGenericObject) {
    try {
      await new BusinessCategoryService().update(uuid, body, null);

      return await new BusinessCategoryService().toTree();
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @Delete(':id')
  async delete(@Param('id') uuid: string, @Query() queryParams) {
    try {
      const deleteType = TreeDeleteType[queryParams.deleteType as keyof typeof TreeDeleteType];

      await new BusinessCategoryService().deleteNode(uuid, deleteType);

      return await new BusinessCategoryService().toTree();
    } catch (e) {
      throw new FailedDelete();
    }
  }
}
