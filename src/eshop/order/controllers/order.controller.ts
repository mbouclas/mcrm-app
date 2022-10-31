import { Body, Controller, Delete, Get, Param, Patch, Post ,Query} from "@nestjs/common";
import { IGenericObject } from "~models/general";
import { OrderService } from "~eshop/order/services/order.service";

@Controller('api/order')
export class OrderController {

  constructor(

  ) {
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = (queryParams['with']) ? queryParams['with'] : [];

    return await (new OrderService()).findOne({ uuid }, rels);
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) {

  }

  @Post()
  async store(@Body() data: IGenericObject) {

  }

  @Delete()
  async delete(@Param('id') uuid: string) {

  }
}

