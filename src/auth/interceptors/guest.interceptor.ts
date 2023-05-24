import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";
import { UserModel } from "~user/models/user.model";

@Injectable()
export class GuestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((user: UserModel) =>  {
          return {
            email : user.email,
            firstName : user.firstName,
            lastName : user.lastName,
            gates: user['gates'],
            addresses: user['address'],
          }
        }
      ));
  }
}
