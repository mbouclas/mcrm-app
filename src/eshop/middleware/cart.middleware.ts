import { Injectable, NestMiddleware } from '@nestjs/common';
import { Cart } from '../cart/Cart';
import { store } from '~root/state';
import { CacheService } from '~shared/services/cache.service';

@Injectable()
export class CartMiddleware implements NestMiddleware {
  private cache: CacheService;
  constructor() {
    this.cache = new CacheService();
  }
  async use(req: any, res: any, next: () => void) {
    const cart = new Cart();
    let userId;
    let sessionId = req.session.id;
    // We got a session header, get it from redis
    //

    if (req.headers['authorization']) {
      const session = await this.cache.get(`token-${req.headers['authorization'].replace('Bearer ', '')}`);
      req.session.user = session.user;
    }

    if (req.session.user && req.session.user) {
      userId = req.session.user['uuid'];
    }
    //If no existing cart is found, a new one will be created and passed down to the controller
    await cart.initialize(sessionId, userId);

    req.session.cart = cart;
    res.header('x-sess-id', sessionId);
    next();
  }
}
