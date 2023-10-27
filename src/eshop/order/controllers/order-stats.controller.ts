import { Controller, Get, Query } from "@nestjs/common";
import { OrderStatsService } from "~eshop/order/services/order-stats.service";

@Controller('api/order-stats')
export class OrderStatsController {

  onApplicationBootstrap() {
/*    setTimeout(async () => {
      const s = await new OrderStatsService().loader(['salesByDate']);
      console.log(s)
    }, 1000);*/
  }

  @Get('')
  async stats(@Query('with') items = ['*']) {
    return await new OrderStatsService().loader(items);
  }

  @Get('aggregate')
  async aggregate() {
    return await new OrderStatsService().getAggregateStats();
  }

}
