import { Controller, Get, Put, Post, Session, Body, Delete, Param, Patch, Req } from "@nestjs/common";
import { CartService, ICartItem } from "~eshop/cart/cart.service";
import { IGenericObject } from '~models/general';
import { ISessionData } from "~shared/models/session.model";

export class AddToCartDto {
  id: string;
  variantId?: string;
  quantity: number;
  metaData?: IGenericObject;
  overwriteQuantity?: boolean;
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
  async get(@Req() req: any, @Session() session: ISessionData) {

    return session.cart.toObject();
  }

  @Post('add')
  async addToCart(@Req() req: any, @Body() item: AddToCartDto, @Session() session: ISessionData) {
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
      session.cart.add(cartItem, item.overwriteQuantity || false);
    } catch (e) {
      console.log(e);
    }

    await session.cart.save();

    return session.cart.toObject();
  }

  @Patch('update')
  async updateCart(@Req() req: any, @Body() items: ICartItem[], @Session() session: ISessionData) {
    session.cart.updateItems(items);

    await session.cart.save();
    return session.cart.toObject();
  }

  @Post('clear')
  async clear(@Req() req: any, @Session() session: ISessionData) {
    try {
      session.cart.clear();
      await session.cart.clearWithDb();

      await session.cart.save();

      return session.cart.toObject();
    } catch (e) {
      return { success: false, reason: 'CouldNotClear' };
    }
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') productId: string, @Session() session: ISessionData) {
    try {
      session.cart.remove({ productId });
      //  // need to disassociate the cart from the user with detach
      await session.cart.save();
      return session.cart.toObject();
    } catch (e) {
      return { success: false, reason: 'ProductNotFound' };
    }
  }

  @Put(':id')
  async manageCart(@Req() req: any, @Param('id') productId: string, @Body() item: ManageCartDto, @Session() session: ISessionData) {
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
      console.log(e);
      return { success: false, reason: 'ProductNotFound' };
    }

    return session.cart.toObject();
  }
}
