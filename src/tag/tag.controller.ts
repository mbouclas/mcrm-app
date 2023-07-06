import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { TagService } from "~tag/services/tag.service";
import { IGenericObject } from "~models/general";
import { IsNotEmpty } from "class-validator";

class TagDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  model: string;

  slug?: string;
  uuid?: string;
}

@Controller('api/tag')
export class TagController {
  constructor(private service: TagService) {
  }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await (new TagService).find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Post('')
  async create(@Body() body: TagDto) {
    const res = await this.service.quickAddTag(body.model, body.name);
    return Array.isArray(res) ? res[0].tag : res.tag;
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string) {
    return await new TagService().delete(uuid);
  }

  @Post('attach/:uuid')
  async attachToModel(@Body() body: TagDto, @Param('uuid') uuid: string) {
    return await this.service.addTagToModel(body.model, { uuid }, { uuid: body.uuid});
  }

  @Post('detach/:uuid')
  async detachFromModel(@Body() body: TagDto, @Param('uuid') uuid: string) {
    await this.service.removeTagFromModel(body.model, { uuid }, { uuid: body.uuid});

    return { success: true };
  }
}
