import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SalesChannelsService } from "~sales-channels/sales-channels.service";
import { IsArray, IsNotEmpty } from "class-validator";
import { SalesChannelModel } from "~sales-channels/sales-channel.model";

class PostedItemDto {
  @IsNotEmpty()
  @IsArray()
  channels: any[];

  @IsNotEmpty()
  model: string;
}

@Controller('api/sales-channels')
export class SalesChannelsController {
  @Get()
  async find(@Query() queryParams = {}) {
    return await new SalesChannelsService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Post('/:itemId/save')
  async save(@Param('itemId') itemId: string, @Body() data: PostedItemDto) {
    return new SalesChannelsService().syncToModel(data.model, itemId, data.channels);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new SalesChannelsService().findOne({ uuid }, rels);
  }

  @Patch(':uuid')
  async update(@Param('uuid') uuid: string, @Body() body: Partial<SalesChannelModel>) {
    return await new SalesChannelsService().update(uuid, body);
  }

  @Post()
  async store(@Body() body: Partial<SalesChannelModel>) {
    return await new SalesChannelsService().store(body);
  }
}
