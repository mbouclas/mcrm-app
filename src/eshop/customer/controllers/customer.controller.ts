import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserService } from '~user/services/user.service';
import { IGenericObject } from '~root/models/general';

@Controller('api/customer')
export class CustomerController {
  @Get('')
  async find(@Query() queryParams = {}) {
    try {
      return await new UserService().find(queryParams, queryParams['with'] || []);
    } catch (e) {
      console.log(e);
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new UserService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      console.log(e);
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      return await new UserService().update(uuid, body);
    } catch (e) {
      console.log(e);
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
