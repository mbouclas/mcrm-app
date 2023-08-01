import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { store } from '~root/state';
import { RoleModel } from '~user/role/models/role.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { OnEvent } from '@nestjs/event-emitter';

export class RoleModelDto {
  tempUuid?: string;
  uuid?: string;
  name?: string;
  level?: number;
  description?: string;
  displayName?: string;
}

@McmsDi({
  id: 'RoleService',
  type: 'service',
})
@Injectable()
export class RoleService extends BaseNeoService {
  protected relationships = [];
  protected model: typeof RoleModel;
  constructor() {
    super();
    this.model = store.getState().models.Role;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}
}
