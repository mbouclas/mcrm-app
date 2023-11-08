import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors } from "@nestjs/common";
import { NotFound } from "~eshop/customer/exceptions";
import { SanitizeUserForApiInterceptor } from "~user/interceptors/sanitize-user-for-api.interceptor";
import { UserGroupService } from "~eshop/user-group/user-group.service";
import { UserGroupModel } from "~eshop/user-group/user-group.model";
import BaseHttpException from "~shared/exceptions/base-http-exception";

@Controller('api/user-group')
export class UserGroupController {

  @Get('')
  async find(@Query() queryParams = {}) {

    try {
      return await new UserGroupService().find(queryParams, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Get(':uuid')
  @UseInterceptors(SanitizeUserForApiInterceptor)
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new UserGroupService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Post('')
  async store(@Body() body: Partial<UserGroupModel>) {
    try {
      return await new UserGroupService().store(body);
    }
    catch (e) {
      throw new BaseHttpException(e);
    }
  }

  @Patch(':uuid')
  async update(@Body() body: Partial<UserGroupModel>, @Param('uuid') uuid: string) {
    try {
      return await new UserGroupService().update(uuid, body);
    }
    catch (e) {
      throw new BaseHttpException(e);
    }
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new UserGroupService().delete(uuid);
    }
    catch (e) {
      throw new BaseHttpException(e);
    }
  }
}
