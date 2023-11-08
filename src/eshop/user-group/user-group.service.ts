import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { McrmNeoService } from "~neo4j/neo4j.decorators";
import { UserGroupModel } from "~eshop/user-group/user-group.model";

@Injectable()
@McrmNeoService('UserGroup')
export class UserGroupService extends BaseNeoService {

  async update(uuid: string, group: Partial<UserGroupModel>) {
    if (typeof group.default === 'boolean' && group.default === true) {
      await this.neo.write(`MATCH (ug:UserGroup) WHERE ug.default = true SET ug.default = false RETURN ug`);
    }

    return await super.update(uuid, group);
  }

  async getDefaultGroup() {
    try {
      return await this.findOne({default: true});
    }
    catch (e) {
      return null;
    }
  }
}
