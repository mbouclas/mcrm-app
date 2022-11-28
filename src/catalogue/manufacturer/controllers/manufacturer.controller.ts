import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { ManufacturerService } from '~catalogue/manufacturer/services/manufacturer.service';

@Controller('api/manufacturer')
export class ManufacturerController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new ManufacturerService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    return await new ManufacturerService().update(uuid, body);
  }

  @Post()
  async store(@Body() body: IGenericObject) {
    return await new ManufacturerService().store(body);
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new ManufacturerService().delete(uuid);
  }
}
