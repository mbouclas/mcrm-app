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
import { UserService } from '~user/services/user.service';
import { IGenericObject } from '~root/models/general';
import { ISessionData } from '~shared/models/session.model';
import { GateGuard } from '~user/guards/gate.guard';
import { RoleGuard } from '~user/guards/role.guard';
import { LevelGuard } from '~user/guards/level.guard';

@Controller('api/user')
export class UserController {
  @Get('')
  // @SetMetadata('gates', ['users.menu.roles'])
  // @SetMetadata('roles', {roles: ['admin'], match : 'min'})
  // @SetMetadata('level', {level: 30, match : 'min'})
  // @UseGuards(RoleGuard)
  // @UseGuards(LevelGuard)
  // @UseGuards(GateGuard)
  async find(@Query() queryParams = {}, @Session() session: ISessionData) {
    queryParams['level'] = `::${UserService.userMaxLevel(session.user)}`;
    return await new UserService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}, @Session() session: ISessionData) {
    queryParams['level'] = `::${UserService.userMaxRole(session.user)}`;
    try {
      return new UserService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
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

  @Post(':uuid/manage-role')
  async manageRole(@Body() body: IGenericObject, @Param('uuid') uuid: string, @Session() session: ISessionData) {
    try {
      const userLevel = UserService.userMaxLevel(session.user);

      const targetUser = await new UserService().findOne({ uuid }, ['role']);
      const targetUserLevel = UserService.userMaxLevel(targetUser);

      if (userLevel < targetUserLevel) {
        return { success: false, message: 'unathorized', code: 'unauthorized' };
      }
      const userGate = UserService.inGates(session.user, ['users.menu.roles']);

      if (!userGate) {
        return { success: false, message: 'unathorized', code: 'unauthorized' };
      }

      if ((body.type = 'ASSIGN')) {
        await new UserService().attachToModelById(targetUser.uuid, body.uuid, 'role');
      }

      if (body.type === 'UNASSIGN') {
        await new UserService().detachFromModelById(targetUser.uuid, body.uuid, 'role');
      }

      return { success: true };
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
