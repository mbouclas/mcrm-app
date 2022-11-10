import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderService } from '~eshop/order/services/order.service';
import { CartService } from '~eshop/cart/cart.service';
import { SessionData } from 'express-session';

@Controller('api/order')
export class OrderController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findOne({ uuid }, rels);
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) {}

  @Post()
  async store(@Body() data: IGenericObject) {}

  @Post(`order-simulation`)
  async orderSimulation(
    @Session() session: SessionData,
    @Body() item: IGenericObject,
  ) {
    const userId = session.user && session.user['uuid'];
    let cartItem;

    try {
      cartItem = await new CartService().createCartItemFromProductId(
        item.id,
        item.quantity,
        item.variantId,
        userId,
      );
    } catch (e) {
      return { success: false, reason: 'ProductNotFound' };
    }

    try {
      session.cart.add(cartItem);
    } catch (e) {
      console.log(e);
    }

    await session.cart.save();

    await new OrderService().store({
      paymentMethod: item.paymentMethod,
      shippingMethod: item.shippingMethod,
    });

    return true;
  }

  @Delete()
  async delete(@Param('id') uuid: string) {}
}
