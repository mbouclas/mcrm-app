import {
  Post,
  Controller,
  Get,
  Query,
  Param,
  Patch,
  Body,
  Delete,
  Session,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { IGenericObject } from '~root/models/general';
import { ISessionData } from '~shared/models/session.model';
import { GateGuard } from '~user/guards/gate.guard';

@Controller('api/role')
export class RoleController {
  @SetMetadata('gates', ['users.menu.roles'])
  @UseGuards(GateGuard)
  @Get('')
  async find(@Query() queryParams = {}, @Session() session: ISessionData) {
    return await new RoleService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}, @Session() session: ISessionData) {
    try {
      return new RoleService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      return await new RoleService().update(uuid, body);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new RoleService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
