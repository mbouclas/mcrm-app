import { Injectable, NestMiddleware } from "@nestjs/common";
import { Cart } from '../cart/Cart';
import { CacheService } from '~shared/services/cache.service';
import { redisSessionStore } from "~root/main";
import { Request } from 'express';
import {cloneDeep} from 'lodash';
import { SessionData } from "express-session";

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
    let session;
    req.userSession = req.session;
    // We got a session header, get it from redis
    //

    //sometimes the session id is null but as a string, so we need to check for that
    if (req.headers['x-sess-id'] && req.headers['x-sess-id'] !== 'null') {
      session = await this.cache.get(`sess:${req.headers['x-sess-id']}`);
      sessionId = req.headers['x-sess-id'];
      await this.cache.del(`sess:${req.session.id}`);// clear the old session
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

/*    redisSessionStore.destroy(req.session.id, (err) => {


    });*/
    await (new UserSession(req)).set(session)

    res.header('x-sess-id', sessionId);
    next();
  }
}

export class UserSession {
  constructor(protected req: Request) {
  }

  async set(session: SessionData) {
    if (!session) {
      return ;
    }
    return new Promise((resolve, reject) => {
      redisSessionStore.set(this.req['userSessionId'], session, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(true);
      });
    });
  }

  async get(): Promise<any> {
    return new Promise((resolve, reject) => {
      redisSessionStore.get(this.req['userSessionId'], async (err, session) => {
        if (err) {
          return reject(err);
        }

        if (!session) {
          session = {};
        }

        const userId = session.user && session.user['uuid'] ? session.user['uuid'] : null;

        session.cart = await (new Cart()).initialize(this.req['userSessionId'], userId);

        resolve(session);
      });
    });
  }

  async update(key: string, sessionData: any) {
    return new Promise((resolve, reject) => {
      redisSessionStore.get(this.req['userSessionId'], (err, session) => {
        if (err) {
          return reject(err);
        }

        if (!session) {
          resolve({});
        }

        session[key] = sessionData;

        redisSessionStore.set(this.req['userSessionId'], session, (err) => {
          if (err) {
            return reject(err);
          }

          resolve(session);
        });

      });
    });
  }

  async destroy() {
    return new Promise((resolve, reject) => {
      redisSessionStore.destroy(this.req['userSessionId'], (err) => {
        if (err) {
          return reject(err);
        }

        resolve(true);
      });
    });
  }
}
