import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { OAUTH2 } from '../oauth2.provider';
import OAuth2Server from 'oauth2-server';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Request as Oauth2Request, Response as Oauth2Response } from 'oauth2-server';
import { CacheService } from '~shared/services/cache.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private cache: CacheService;
  constructor(@Inject(OAUTH2) private server: OAuth2Server) {
    this.cache = new CacheService();
  }

  async use(req: ExpressRequest, res: ExpressResponse, next: () => void) {
    if (process.env.NODE_ENV === 'development' && process.env.APPLY_AUTH_MIDDLEWARE === 'false') {
      return next();
    }

    if (req.headers['authorization']) {
      const session = await this.cache.get(`token-${req.headers['authorization'].replace('Bearer ', '')}`);
      req.session.user = session.user;
    }

    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.1` });
    }

    let authResult;
    try {
      authResult = await this.server.authenticate(new Oauth2Request(req), new Oauth2Response(res));
    } catch (err) {
      // Log.error('Error during login', err);
      let reason,
        code = `500.2`;

      // Missing Auth Headers
      if (err.name === 'unauthorized_request') {
        reason = `Unauthorized request: no authentication given`;
      }
      // Wrong token
      else if (err.name === 'invalid_token') {
        reason = `Unauthorized request: no authentication given`;
        code = '500.3';
      } else {
        console.log(err);
        reason = `Oops, something went wrong`;
        code = '500.4';
      }

      return res.status(err.code || 500).json({ success: false, reason, code });
    }

    next();
  }
}
