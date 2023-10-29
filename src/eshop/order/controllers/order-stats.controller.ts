import { Controller, Get, Param, Query } from "@nestjs/common";
import { OrderStatsService } from "~eshop/order/services/order-stats.service";

@Controller('api/order-stats')
export class OrderStatsController {

  onApplicationBootstrap() {
/*    setTimeout(async () => {
      const s = await new OrderStatsService().loader(['salesByDate', 'topGrossingSalesChannels'], 5,'2023-06-01', '2023-07-01');
      console.log(s)
    }, 1000);*/
  }

  @Get('')
  async stats(@Query('with') items = ['*'], @Query('fromDate') fromDate = null, @Query('toDate') toDate = null, @Query('limit') limit = 5) {
    return await new OrderStatsService().loader(items, limit, fromDate, toDate);
  }

  @Get('load/:item')
  async load(@Param('item') item = 'salesByDate', @Query('fromDate') fromDate = null, @Query('toDate') toDate = null, @Query('limit') limit = 5) {
    const res = await new OrderStatsService().loader([item], limit, fromDate, toDate);

    return res[item];
  }

  @Get('aggregate')
  async aggregate() {
    return await new OrderStatsService().getAggregateStats();
  }

}
