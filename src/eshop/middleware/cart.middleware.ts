import { Injectable, NestMiddleware } from '@nestjs/common';
import { Cart } from '../cart/Cart';
import { store } from "~root/state";
import { CacheService } from "~shared/services/cache.service";



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
    if (req.headers['x-sess-id']) {
      const session = await this.cache.get(`sess:${req.headers['x-sess-id']}`);
      if (session) {
        req.sessionID = req.headers['x-sess-id'];
        req.sessionStore.get(req.headers['x-sess-id'], function (err, sess) {
          // This attaches the session to the req.
          req.sessionStore.createSession(req, session);
        });

        req.session.user = session;
        sessionId = req.sessionID;
      }
    }

    if (req.session.user && req.session.user.user) {
      userId = req.session.user.user['uuid'];
    }
    //If no existing cart is found, a new one will be created and passed down to the controller
    await cart.initialize(sessionId, userId);


    req.session.cart = cart;
    res.header('x-sess-id', sessionId);
    next();
  }
}
