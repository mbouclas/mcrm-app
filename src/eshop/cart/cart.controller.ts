import { Controller, Get, Put, Post, Session, Body, Delete, Param } from '@nestjs/common';
import { SessionData } from 'express-session';
import { CartService } from '~eshop/cart/cart.service';
import { IGenericObject } from '~models/general';

export class AddToCartDto {
  id: string;
  variantId?: string;
  quantity: number;
  metaData?: IGenericObject;
}

export class ManageCartDto {
  quantity: number;
  variantId?: string;
  metaData?: IGenericObject;
}

@Controller('cart')
export class CartController {
  constructor(protected cartService: CartService) {}

  @Get('get')
  async get(@Session() session: SessionData) {
    return session.cart.toObject();
  }

  @Post('add')
  async addToCart(@Session() session: SessionData, @Body() item: AddToCartDto) {
    const userId = session.user && session.user['uuid'];
    let cartItem;

    try {
      cartItem = await this.cartService.createCartItemFromProductId(
        item.id,
        item.quantity,
        item.variantId,
        item.metaData,
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

    return session.cart.toObject();
  }

  @Post('clear')
  async clear(@Session() session: SessionData) {
    try {
      session.cart.clear();

      await session.cart.save();

      return session.cart.toObject();
    } catch (e) {
      return { success: false, reason: 'CouldNotClear' };
    }
  }

  @Delete(':id')
  async delete(@Session() session: SessionData, @Param('id') uuid: string) {
    try {
      //  session.cart.remove({ uuid });
      //  // need to disassociate the cart from the user with detach
      //  await session.cart.save();
      //  return session.cart.toObject();
    } catch (e) {
      return { success: false, reason: 'ProductNotFound' };
    }
  }

  @Put(':id')
  async manageCart(@Session() session: SessionData, @Param('id') productId: string, @Body() item: ManageCartDto) {
    const userId = session.user && session.user['uuid'];

    try {
      const cartItem = await this.cartService.createCartItemFromProductId(
        productId,
        item.quantity,
        item.variantId,
        item.metaData,
        userId,
      );

      let idx = session.cart.existingItem(cartItem);

      if (idx === -1 && item.quantity > 0) {
        session.cart.manageAdd(cartItem);
      }

      if (idx !== -1 && item.quantity === 0) {
        session.cart.manageRemove(idx);
      }

      if (idx !== -1 && item.quantity > 1) {
        session.cart.manageUpdateQuantity(idx, item.quantity);
      }

      await session.cart.save();
      await session.cart.attachCartToUser({ uuid: userId });
    } catch (e) {
      return { success: false, reason: 'ProductNotFound' };
    }

    return session.cart.toObject();
  }
}
