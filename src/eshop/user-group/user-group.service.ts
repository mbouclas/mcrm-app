import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { McrmNeoService } from "~neo4j/neo4j.decorators";

@Injectable()
@McrmNeoService('UserGroup')
export class UserGroupService extends BaseNeoService {
  async getDefaultGroup() {
    try {
      return await this.findOne({default: true});
    }
    catch (e) {
      return null;
    }
  }
}
