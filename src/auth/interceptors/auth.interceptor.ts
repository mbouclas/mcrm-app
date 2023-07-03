import { CallHandler, ExecutionContext, Inject, NestInterceptor } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { OAUTH2 } from "~root/auth/oauth2.provider";
import OAuth2Server, { Request as Oauth2Request, Response as Oauth2Response } from "oauth2-server";
import { CacheService } from "~shared/services/cache.service";
import { retryJob } from "bullmq/dist/esm/scripts";

export class AuthInterceptor implements NestInterceptor {
  private cache: CacheService;
  constructor(@Inject(OAUTH2) private server: OAuth2Server) {
    this.cache = new CacheService();
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>
  {
    let session;
    const headers = context.switchToHttp().getRequest().headers;
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    if (!headers['authorization']) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'Unauthorized', code: `500.5`});
    }

    if (headers['authorization']) {
      session = await this.cache.get(`token-${headers['authorization'].replace('Bearer ', '')}`);
    }

    if (!session) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'Unauthorized', code: `500.6`});
    }

    try {
      await this.server.authenticate(new Oauth2Request(req), new Oauth2Response(res));
    }
    catch (e) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'Unauthorized', code: `500.7`});
    }


    return next.handle();
  }
}
