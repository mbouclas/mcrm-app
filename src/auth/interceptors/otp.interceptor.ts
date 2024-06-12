import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from "rxjs";
import { CacheService } from "~shared/services/cache.service";

@Injectable()
export class OtpInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>
  {
    if (process.env.ENV === 'development') {
      // return next.handle();
    }

    const headers = context.switchToHttp().getRequest().headers;
    let cached;
    try {
      cached = await (new CacheService()).get(headers['x-otp-id']);
    }
    catch (e) {
      return of({success: false, reason: 'Unauthorized', code: `500.3.1`});
    }


    if (!cached) return of({success: false, reason: 'Unauthorized', code: `500.3.2`});

    if (cached !== headers['x-otp']) return of({success: false, reason: 'Unauthorized', code: `500.4`});



    return next.handle();
  }
}
