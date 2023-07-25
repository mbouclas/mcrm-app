import { Injectable, NestMiddleware } from "@nestjs/common";
import { Cart } from '../cart/Cart';
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
    req.session.userSessionId = req.session.id;
    let sessionId = req.session.id;
    let session;
    req.userSession = req.session;
    // We got a session header, get it from redis
    //

    //sometimes the session id is null but as a string, so we need to check for that
    if (req.headers['x-sess-id'] && req.headers['x-sess-id'] !== 'null') {
      session = await this.cache.get(`sess:${req.headers['x-sess-id']}`);
      sessionId = req.headers['x-sess-id'];
      if (!session || !session.userSessionId || req.headers['x-sess-id'] !== session.userSessionId) {
        await this.cache.del(`sess:${req.session.id}`);// clear the old session
      }
    }

    if (req.headers['authorization']) {
      session = await this.cache.get(`token-${req.headers['authorization'].replace('Bearer ', '')}`);
    }

    if (session) {
      Object.keys(session).forEach((key) => {
        req.session[key] = session[key];
      });

      req.userSession = session;
      req['userSessionId'] = sessionId;
    }

    if (req.session.user && req.session.user['uuid']) {
      userId = req.session.user['uuid'];
    }

    //If no existing cart is found, a new one will be created and passed down to the controller

    await cart.initialize(sessionId, userId);

    req.session.cart = cart;
    req['userSession'].cart = cart;

    res.header('x-sess-id', sessionId);
    next();
  }
}
