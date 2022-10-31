import { Injectable } from '@nestjs/common';
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { OrderModel } from "~eshop/order/models/order.model";
import { BaseNeoService } from "~shared/services/base-neo.service";
import {  IGenericObject } from "~models/general";

export class OrderModelDto {
  tempUuid?: string;
  uuid?: string;
  orderId?: string;
  total?: number;
  shippingMethod: string;
  paymentMethod: string;

  static status: [
    {
      id: 1,
      label: 'started'
    },
    {
      id: 2,
      label: 'processing'
    },
    {
      id: 3,
      label: 'shipped' 
    },
    {
      id: 4,
      label: 'completed'
    },
    {
      id: 5,
      label: 'cancelled'
    }
  ]

}

@Injectable()
export class OrderService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.Order;


    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

     // const s = new OrderService();

     // const r = await s.store({
     //   orderId: 'orderid12',
     //   total: 40,
     //   shippingMethod: 'ship1',
     //   paymentMethod: 'payment1',
     // });

     // console.log(r)

    // console.log(r['property'][0])

  }

  async findOne(filter: IGenericObject, rels = []): Promise<OrderModel> {
    const item = await super.findOne(filter, rels) as unknown as OrderModel;
    return item;
  }

  async store(record: OrderModelDto, userId?: string) {
    console.log('record for create' ,record);
    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid:string, record: OrderModelDto, userId?:string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
