import { Controller, Get, Query, Param, Patch, Body, Delete } from '@nestjs/common';
import { UserService } from '~user/services/user.service';
import { IGenericObject } from '~root/models/general';

@Controller('api/user')
export class UserController {
  @Get('')
  async find(@Query() queryParams = {}) {
    return await new UserService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new UserService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      console.log('uud', uuid);
      return await new UserService().update(uuid, body);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new UserService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
