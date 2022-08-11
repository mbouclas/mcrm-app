import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { UserService } from "~user/services/user.service";
import { IGate } from "~admin/models/gates";
import { OnEvent } from "@nestjs/event-emitter";
import { IBaseFilter } from "~models/general";
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";

@Injectable()
export class GateService extends BaseNeoService {

  constructor() {
    super();
    this.model = store.getState().models.Gate;
  }


  @OnEvent('app.loaded')
  async onAppLoaded() {
    // const s = new GateService();
    // const r = await s.all(true, {email: 'mbouclas@gmail.com'})
    // console.log(r)
  }

  async all(sanitize = false, userToFilter?: IBaseFilter) {
    const result = await this.neo.readWithCleanUp(`MATCH (g:Gate) return g as gate ORDER BY g.name ASC`, {});

    const allGates = result.map((record: any) => {
      if (!sanitize) {
        return record;
      }

      return {
        uuid: record.uuid,
        gate: record.gate,
        level: record.level,
        name: record.name,
        provider: record.provider
      };
    });

    if (!userToFilter) { return allGates; }


    // get the user first
    const user = await (new UserService()).findOne(userToFilter, ['role']);
    const userLevel = Math.max(...user['role'].map(role => role.level));

    return allGates.filter((gate: IGate) => {
      return gate.level <= userLevel;
    });
  }
}
