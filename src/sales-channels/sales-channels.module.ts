import { Module } from '@nestjs/common';
import { SalesChannelsService } from './sales-channels.service';
import { SalesChannelsController } from './sales-channels.controller';
import { SalesChannelModel } from "~sales-channels/sales-channel.model";

@Module({
  providers: [
    SalesChannelsService,
    SalesChannelModel,
  ],
  controllers: [SalesChannelsController]
})
export class SalesChannelsModule {}
