import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IGenericObject } from "~models/general";
import { PageCategoryService } from "~cms/page/services/page-category.service";

@Controller('api/page-category')
export class PageCategoryController {

  constructor(

  ) {
  }

  @Get('tree')
  async tree() {
    return await (new PageCategoryService).getRootTree();
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) {

  }

  @Post()
  async store(@Body() data: IGenericObject) {

  }

  @Delete()
  async delete(@Param('id') uuid: string) {

  }
}

