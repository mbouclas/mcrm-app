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
import { AuthService, hashPassword } from '~root/auth/auth.service';

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
    const userLevel = UserService.userMaxLevel(session.user);

    const targetUser = await new UserService().findOne({ uuid }, ['role']);
    const targetUserLevel = UserService.userMaxLevel(targetUser);

    if (userLevel < targetUserLevel) {
      return { success: false, message: 'Unauthorized', code: '500.3' };
    }
    const userGate = UserService.inGates(session.user, ['users.menu.roles']);

    if (!userGate) {
      return { success: false, message: 'Unauthorized', code: '500.3' };
    }

    if (body.type === 'ASSIGN') {
      try {
        await new UserService().attachToModelById(targetUser.uuid, body.roleUuid, 'role');
      } catch (e) {
        return { success: false, message: e.message, code: e.getCode() };
      }
    }

    if (body.type === 'UNASSIGN') {
      try {
        await new UserService().detachFromModelById(targetUser.uuid, body.roleUuid, 'role');
      } catch (e) {
        return { success: false, message: e.message, code: e.getCode() };
      }
    }

    return { success: true };
  }

  @Post(':uuid/change-password')
  async changePassword(@Body() body: IGenericObject, @Param('uuid') uuid: string, @Session() session: ISessionData) {
    const userLevel = UserService.userMaxLevel(session.user);

    const targetUser = await new UserService().findOne({ uuid }, ['role']);
    const targetUserLevel = UserService.userMaxLevel(targetUser);

    if (userLevel < targetUserLevel) {
      return { success: false, message: 'Unauthorized', code: '500.3' };
    }
    const userGate = UserService.inGates(session.user, ['mcms.user.password.update']);

    if (!userGate) {
      return { success: false, message: 'Unauthorized', code: '500.3' };
    }

    const authService = new AuthService();
    const hashedPassword = await authService.hasher.hashPassword(body.password);

    try {
      console.log(uuid);
      console.log(uuid);
      console.log(uuid);
      console.log(uuid);
      console.log(uuid);
      console.log(uuid);
      await new UserService().update(uuid, {
        password: hashedPassword,
      });
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }

    return { success: true };
  }
}
