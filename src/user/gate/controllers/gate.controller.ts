import { Post, Controller, Get, Query, Param, Patch, Body, Delete, SetMetadata, UseGuards } from '@nestjs/common';
import { GateService } from '../services/gate.service';
import { IGenericObject } from '~root/models/general';
import { GateGuard } from '~user/guards/gate.guard';
import slugify from 'slug';
import { validateData } from '~helpers/validateData';
import { FailedUpdate, FailedDelete, FailedCreate, NotFound } from '../exceptions';
import errors from '../exceptions/errors';
import { z } from 'zod';

const gateSchema = z.object({
  name: z.string().min(1, errors.NAME_REQUIRED.code),
  level: z.number().min(1, errors.LEVEL_MINIMUM.code).max(99, errors.LEVEL_MINIMUM.code),
  provider: z.string().min(1, errors.PROVIDER_REQUIRED.code),
  gate: z.string().min(1, errors.GATE_REQUIRED.code),
});

@Controller('api/gate')
export class GateController {
  @SetMetadata('gates', ['users.menu.gates'])
  @UseGuards(GateGuard)
  @Get('')
  async find(@Query() queryParams = {}) {
    return await new GateService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @SetMetadata('gates', ['users.menu.gates'])
  @UseGuards(GateGuard)
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      return new GateService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    await validateData(body, gateSchema);

    try {
      const gateData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new GateService().update(uuid, gateData);
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @SetMetadata('gates', ['mcms.admin.gate.create'])
  @UseGuards(GateGuard)
  @Post()
  async create(@Body() body: IGenericObject) {
    await validateData(body, gateSchema);

    try {
      const gateData = {
        name: body.name,
        level: body.level,
        gate: body.gate,
        provider: body.provider,
      };

      return await new GateService().store(gateData);
    } catch (e) {
      throw new FailedCreate();
    }
  }

  @SetMetadata('gates', ['mcms.admin.gate.delete'])
  @UseGuards(GateGuard)
  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new GateService().delete(uuid);
    } catch (e) {
      throw new FailedDelete();
    }
  }
}
