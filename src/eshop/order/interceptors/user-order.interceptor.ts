import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { OrderModel } from "~eshop/order/models/order.model";
import { IGenericObject, IPagination } from "~models/general";

export class UserOrderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((res: IPagination<OrderModel>) => {
          if (res.total === 0) {
            return res;
          }

          const data = res.data.map((order: OrderModel) => {
            return {
              orderId: order.orderId,
              metaData: formatMetaData(order['metaData']),
              shippingStatus: order['shippingStatus'],
              createdAt: order['createdAt'],
              updatedAt: order['updatedAt'],
              status: order['status'],
              paymentStatus: order['paymentStatus'],
              total: order['total'],
            }
          });

          return { ...res, ...{data} };
        })
      )
  }
}

function formatMetaData(metaData: IGenericObject) {
  return {
    cart: metaData.cart,
  }
}
