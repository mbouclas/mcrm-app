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
import { GateService } from '../services/gate.service';
import { IGenericObject } from '~root/models/general';
import { ISessionData } from '~shared/models/session.model';
import { GateGuard } from '~user/guards/gate.guard';
import * as slugify from 'slug';
import { validateData } from '~helpers/validateData';
import * as yup from 'yup';

const gateSchema = yup.object().shape({
  name: yup.string().required('400.56'),
  level: yup.number().required('400.55').min(1, '400.55').max(99, '400.55'),
  description: yup.string().required('400.57'),
});

@Controller('api/gate')
export class GateController {
  @Get('')
  async find(@Query() queryParams = {}, @Session() session: ISessionData) {
    return await new GateService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}, @Session() session: ISessionData) {
    try {
      return new GateService().findOne({ uuid }, queryParams['with'] || []);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
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
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Post()
  async create(@Body() body: IGenericObject) {
    await validateData(body, gateSchema);

    try {
      const gateData = {
        name: slugify(body.name, { lower: true }),
        level: body.level,
        description: body.description,
        displayName: body.name,
      };

      return await new GateService().store(gateData);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }

  @Delete(`:uuid`)
  async delete(@Param('uuid') uuid: string) {
    try {
      return await new GateService().delete(uuid);
    } catch (e) {
      return { success: false, message: e.message, code: e.getCode() };
    }
  }
}
