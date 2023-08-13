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
import * as slugify from 'slug';

@Controller('api/role')
export class RoleController {
  @SetMetadata('gates', ['users.menu.roles'])
  @UseGuards(GateGuard)
  @Get('')
  async find(@Query() queryParams = {}, @Session() session: ISessionData) {
    return await new RoleService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @SetMetadata('gates', ['users.menu.roles'])
  @UseGuards(GateGuard)
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
      const roleData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new RoleService().update(uuid, roleData);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @SetMetadata('gates', ['mcms.admin.role.create'])
  @UseGuards(GateGuard)
  @Post()
  async create(@Body() body: IGenericObject) {
    try {
      const roleData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new RoleService().store(roleData);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @SetMetadata('gates', ['mcms.admin.role.delete'])
  @UseGuards(GateGuard)
  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new RoleService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
