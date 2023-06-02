import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CacheService } from "~shared/services/cache.service";

@Injectable()
export class SessionRetrieverInterceptor implements NestInterceptor {
  private cache: CacheService;
  constructor() {
    this.cache = new CacheService();
  }
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const headers = context.switchToHttp().getRequest().headers;
    let sessionId = req.session.id;
    let session, userId;

    if (headers['x-sess-id']) {
      session = await this.cache.get(`sess:${req.headers['x-sess-id']}`);
      sessionId = req.headers['x-sess-id'];
    }

    if (req.headers['authorization']) {
      session = await this.cache.get(`token-${req.headers['authorization'].replace('Bearer ', '')}`);
    }

    if (session) {
      Object.keys(session).forEach((key) => {
        req.session[key] = session[key];
      });
    }

    if (req.session.user && req.session.user) {
      userId = req.session.user['uuid'];
    }


    res.header('x-sess-id', sessionId);
    return next.handle();
  }
}
