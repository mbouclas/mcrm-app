import { Module } from '@nestjs/common';
import { RoleModel } from './models/role.model';

@Module({
  providers: [RoleModel],
})
export class RoleModule {}
