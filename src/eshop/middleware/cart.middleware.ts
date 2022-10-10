import { Injectable, NestMiddleware } from '@nestjs/common';
import { Cart } from '../cart/Cart';
import { store } from "~root/state";



@Injectable()
export class CartMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const cart = new Cart();
    let userId;
    if (req.session.user && req.session.user.user) {
      userId = req.session.user.user['uuid'];
    }
    //If no existing cart is found, a new one will be created and passed down to the controller
    await cart.initialize(req.session.id, userId);


    req.session.cart = cart;
    next();
  }
}
