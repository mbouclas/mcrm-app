import { Controller, Get, Post, Session, Body, Delete, Param } from "@nestjs/common";
import { SessionData } from "express-session";
import { CartService } from "~eshop/cart/cart.service";

export class AddToCartDto {
  id: string;
  variantId?: string;
  quantity: number;
}



@Controller('cart')
export class CartController {
  constructor(
    protected cartService: CartService,
  ) {
  }

  @Get('get')
  async get(@Session() session: SessionData) {
    return session.cart.toObject();
  }

  @Post('add')
  async addToCart(@Session() session: SessionData, @Body() item: AddToCartDto) {
    const userId = session.user && session.user['uuid'];
    let cartItem;

    try {
      cartItem = await this.cartService.createCartItemFromProductId(item.id, item.quantity, item.variantId, userId)
    }
    catch (e) {
      return {success: false, reason: 'ProductNotFound'};
    }

    try {
      session.cart.add(cartItem);
    }
    catch (e) {
      console.log(e)
    }

    await session.cart.save();

    return session.cart.toObject();
  }

  @Post('clear')
  async clear(@Session() session: SessionData) {
    try {
      session.cart.clear();

      await session.cart.save();

      return session.cart.toObject();
    }
    catch (e) {
      return {success: false, reason: 'CouldNotClear'};
    }
  }

  @Delete(':id')
  async delete(@Session() session: SessionData, @Param('id') uuid: string) {
    try {
      session.cart.remove({uuid});
      // need to disassociate the cart from the user with detach
      await session.cart.save();

      return session.cart.toObject();
    }
    catch (e) {
      return {success: false, reason: 'ProductNotFound'};
    }
  }
}
