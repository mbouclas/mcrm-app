import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { UserModel } from './models/user.model';
import { UserService } from '~user/services/user.service';
import { SharedModule } from '~shared/shared.module';
import { PersonService } from '~crm/services/person.service';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { GateModule } from './gate/gate.module';

@Module({
  providers: [UserModel, UserService],
  imports: [SharedModule, RoleModule, PermissionModule, GateModule],
})
export class UserModule implements OnModuleInit, OnApplicationBootstrap {
  constructor() {}

  async onModuleInit() {}

  async onApplicationBootstrap() {
    setTimeout(async () => {
      // const s = new UserService();
      // const r = await s.find({email: 'mbouclas', active: true, with: ['role']});
      /*      await s.store({
              email: 'mbouclas@gmail.com.com',
              firstName: 'Michael',
              lastName: 'Bouclas'
            })*/
      // console.log(r.data[0])
      // console.log(store.getState().models['Person'].filterFields)
      // const p = new PersonService();
      // const r = await p.find({firstName: 'Kitsos', with: ['personClassification', 'isOwner']})
      // console.log(r)
    }, 200);
  }
}
