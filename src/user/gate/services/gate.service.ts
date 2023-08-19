import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { store } from '~root/state';
import { GateModel } from '../models/gate.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { OnEvent } from '@nestjs/event-emitter';

export class GateModelDto {
  tempUuid?: string;
  uuid?: string;
  name?: string;
  level?: number;
  description?: string;
  displayName?: string;
}

@McmsDi({
  id: 'GateService',
  type: 'service',
})
@Injectable()
export class GateService extends BaseNeoService {
  protected relationships = [];
  protected model: typeof GateModel;
  constructor() {
    super();
    this.model = store.getState().models.Gate;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}
}
