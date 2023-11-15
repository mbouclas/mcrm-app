import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { Injectable } from "@nestjs/common";
@Injectable()
export class MenuService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.Menu;
  }

  async delete(uuid: string, userId?: string) {
    // delete all menu items
    const query = `
        MATCH (m:Menu {uuid: $uuid})
        OPTIONAL MATCH (m)-[r:HAS_CHILD*]->(i:MenuItem)
        DETACH DELETE m, i
        `;

    try {
      await this.neo.write(query, {uuid});
    }
    catch (e) {
      throw e;
    }

    return {success: true};
  }
}
