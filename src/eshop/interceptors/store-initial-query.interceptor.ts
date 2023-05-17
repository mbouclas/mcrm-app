import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from "rxjs/operators";
import { IStoreInitialQuery } from "~eshop/controllers/store.controller";

/**
 * Reshape the data to remove any data that is not needed for the client
 */
@Injectable()
export class StoreInitialQueryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((value: IStoreInitialQuery) => {
          return {
            shippingMethods: value.shippingMethods.data,
            paymentMethods: value.paymentMethods.data,
            config: value.config,
            test: 1
          };
        }),
      );
  }
}
