import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IGenericObject } from "~models/general";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";

@Controller('api/product-category')
export class ProductCategoryController {

  constructor(

  ) {
  }

  @Get('tree')
  async tree() {
    return await (new ProductCategoryService).getRootTree();
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

