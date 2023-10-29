import { Controller, Get, Param, Query, UseInterceptors } from "@nestjs/common";
import { NotFound } from "~eshop/customer/exceptions";
import { SanitizeUserForApiInterceptor } from "~user/interceptors/sanitize-user-for-api.interceptor";
import { UserGroupService } from "~eshop/user-group/user-group.service";

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
}
