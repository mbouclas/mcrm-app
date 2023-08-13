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

import * as yup from 'yup';
import BaseHttpException from '~root/shared/exceptions/base-http-exception';

const roleSchema = yup.object().shape({
  name: yup.string().required('400.56'),
  level: yup.number().required('400.55').min(1, '400.55').max(99, '400.55'),
  description: yup.string().required('400.57'),
});

export const validateRole = async (body: IGenericObject) => {
  try {
    await roleSchema.validate(body, { abortEarly: false });
  } catch (e) {
    if (e instanceof yup.ValidationError && e.inner.length) {
      const validationErrors = e.inner.map((err) => ({
        field: err.path,
        code: err.message,
      }));

      throw new BaseHttpException({
        error: 'VALIDATION_FAILED',
        reason: 'Validation failed',
        code: '100.10',
        statusCode: 400,
        validationErrors: validationErrors,
      });
    }

    throw e;
  }
};

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
    await validateRole(body);

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
