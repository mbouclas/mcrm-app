import { Post, Controller, Get, Query, Param, Patch, Body, Delete, SetMetadata, UseGuards } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { IGenericObject } from '~root/models/general';
import { GateGuard } from '~user/guards/gate.guard';
import slugify from 'slug';
import { validateData } from '~helpers/validateData';
import * as yup from 'yup';
import errors from '../exceptions/errors';
import { FailedUpdate, FailedDelete, FailedCreate, NotFound } from '../exceptions';

const roleSchema = yup.object().shape({
  name: yup.string().required(errors.NAME_REQUIRED.code),
  level: yup
    .number()
    .required(errors.LEVEL_REQUIRED.code)
    .min(1, errors.LEVEL_MINIMUM.code)
    .max(99, errors.LEVEL_MAXIMUM.code),
  description: yup.string(),
});

@Controller('api/role')
export class RoleController {
  @SetMetadata('gates', ['users.menu.roles'])
  @UseGuards(GateGuard)
  @Get('')
  async find(@Query() queryParams = {}) {
    return await new RoleService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @SetMetadata('gates', ['users.menu.roles'])
  @UseGuards(GateGuard)
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new RoleService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    await validateData(body, roleSchema);

    try {
      const roleData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new RoleService().update(uuid, roleData);
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @SetMetadata('gates', ['mcms.admin.role.create'])
  @UseGuards(GateGuard)
  @Post()
  async create(@Body() body: IGenericObject) {
    await validateData(body, roleSchema);

    try {
      const roleData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new RoleService().store(roleData);
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @SetMetadata('gates', ['mcms.admin.role.delete'])
  @UseGuards(GateGuard)
  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new RoleService().delete(uuid);
    } catch (e) {
      throw new FailedDelete();
    }
  }
}
