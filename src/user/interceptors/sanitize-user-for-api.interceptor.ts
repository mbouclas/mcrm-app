import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";
import { UserModel } from "~user/models/user.model";
import { IPagination } from "~models/general";

@Injectable()
export class SanitizeUserForApiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((user: any) =>  {
          if (!user['data']) {
            delete user.password;

            return user;
          }

          user['data'].forEach((u: UserModel) => {
            delete u.password;
          })
          return user;

        })
      );
  }
}
