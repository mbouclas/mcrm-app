import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";

@Injectable()
export class Area51Service extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.Test;
  }
}
