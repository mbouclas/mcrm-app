import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { store } from "~root/state";

@Injectable()
export class BusinessCategoryService extends BaseNeoTreeService {
  constructor() {
    super();
    this.model = store.getState().models.BusinessCategory;
  }
}
