import { Module } from '@nestjs/common';
import { RoleModel } from './models/role.model';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';

@Module({
  controllers: [RoleController],
  providers: [RoleModel, RoleService],
})
export class RoleModule {}
