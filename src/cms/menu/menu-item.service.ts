import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";


@Injectable()
export class MenuItemService extends BaseNeoTreeService {
  constructor() {
    super();
    this.model = store.getState().models.MenuItem;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new MenuItemService();
    setTimeout(async () => {
      // const r = await s.getRootTree();
      // const r = await s.findAncestors('05e7a5f1-6fe8-4360-b566-afa0b4b79b14');
      // console.log(r);
    }, 1000);
  }
}
