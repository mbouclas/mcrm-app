import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class ProductService extends BaseNeoTreeService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'product.model.updated';
  static createdEventName = 'product.model.created';
  static deletedEventName = 'product.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.Product;
    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    // const s = new ProductService();
    // const r = await s.findOne({slug: 'test'}, ['properties']);

    // console.log(r['property'][0])
  }
}
