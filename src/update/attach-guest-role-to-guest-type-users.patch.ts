import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { UserService } from "~user/services/user.service";
import { SharedModule } from "~shared/shared.module";

@McmsDi({
  id: 'AttachGuestRoleToGuestTypeUsersPatch',
  type: 'patch',
  description: 'Attaches a guest role to all users with a guest type'
})
@Injectable()
export class AttachGuestRoleToGuestTypeUsersPatch {
  async run() {
    const s = new UserService();
    const query = `
      match (n:User {type: 'guest'})
      match (role:Role {name: 'customer'})
      MERGE (n)-[r:HAS_ROLE]->(role)
      ON CREATE set r.createdAt = datetime()
      ON MATCH set r.updatedAt = datetime()
       return n;
    `;

    try {
      await s.neo.write(query);
    }
    catch (e) {
      console.log(`ERROR ATTACHING GUEST ROLE TO GUEST TYPE USERS: ${e.message}`, e);
    }

    SharedModule.logger.log(`ATTACHED GUEST ROLE TO GUEST TYPE USERS`);
  }
}
