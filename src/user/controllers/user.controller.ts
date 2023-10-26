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
import { AuthService } from '~root/auth/auth.service';

import { GateGuard } from '~user/guards/gate.guard';
import { RoleService } from '../role/services/role.service';
import { RoleModel } from '../role/models/role.model';
import { RecordNotFoundException } from '~root/shared/exceptions/record-not-found.exception';
import BaseHttpException from '~root/shared/exceptions/base-http-exception';
import { FailedUpdate, FailedDelete, FailedCreate, NotFound } from '../exceptions';
import errors from '../exceptions/errors';

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
      throw new NotFound();
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    try {
      return await new UserService().update(uuid, body);
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @SetMetadata('gates', ['users.delete'])
  @UseGuards(GateGuard)
  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new UserService().delete(uuid);
    } catch (e) {
      throw new FailedDelete();
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
      await new UserService().update(uuid, {
        password: hashedPassword,
      });
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }

    return { success: true };
  }

  @SetMetadata('gates', ['users.add'])
  @UseGuards(GateGuard)
  @Post('create')
  async createUser(@Body() body: IGenericObject) {
    const authService = new AuthService();
    const hashedPassword = await authService.hasher.hashPassword(body.password);

    let userRole: RoleModel = null;
    try {
      userRole = await new RoleService().findOne({
        name: 'user',
      });
    } catch (e) {
      return { message: e.message, code: e.getCode() };
    }

    try {
      const existingUser = await new UserService().findOne({
        email: body.email,
      });

      if (existingUser) {
        throw new BaseHttpException({
          error: 'USER_EXISTS',
          reason: 'User email already exists',
          code: '100.10',
          statusCode: 400,
          validationErrors: [
            {
              field: 'email',
              code: '400.25',
            },
          ],
        });
      }
    } catch (e) {
      const isBaseHttp = e instanceof BaseHttpException;
      if (isBaseHttp) {
        throw e;
      }

      const isRecordNotFoundError = e instanceof RecordNotFoundException;
      if (!isRecordNotFoundError) {
        return { success: false, message: e.message };
      }
    }

    let user = null;
    try {
      user = await new UserService().store({
        ...body,
        active: true,
        password: hashedPassword,
      });

      await new UserService().attachToModelById(user.uuid, userRole.uuid, 'role');
    } catch (e) {
      throw new FailedCreate();
    }

    return user;
  }
}
