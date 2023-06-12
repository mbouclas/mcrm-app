import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { Injectable } from "@nestjs/common";
@Injectable()
export class MenuService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.Menu;
  }
}
