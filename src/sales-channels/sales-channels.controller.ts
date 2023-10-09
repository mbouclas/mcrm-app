import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { SalesChannelsService } from "~sales-channels/sales-channels.service";
import { IsArray, IsNotEmpty } from "class-validator";

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
}
