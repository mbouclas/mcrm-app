import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import OAuth2Server from "oauth2-server";
import { map } from "rxjs/operators";

@Injectable()
export class RegularUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((value: OAuth2Server.Token) =>  {
          const user = {
            email : value.user.email,
            firstName : value.user.firstName,
            lastName : value.user.lastName,
            gates: value.user.gates,
          };

          const tokens = {
            accessToken: value.accessToken,
            refreshToken: value.refreshToken,
            accessTokenExpiresAt: value.accessTokenExpiresAt,
            refreshTokenExpiresAt: value.refreshTokenExpiresAt,
          };

          return {
            ...{ tokens },
            ...{ user },
          }
        })
      );
  }
}
