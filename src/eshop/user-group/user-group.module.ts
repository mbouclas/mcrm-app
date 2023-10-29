import { Module } from '@nestjs/common';
import { UserGroupController } from "~eshop/user-group/user-group.controller";
import { UserGroupService } from "~eshop/user-group/user-group.service";
import { UserGroupModel } from "~eshop/user-group/user-group.model";

@Module({
  controllers: [
    UserGroupController
  ],
  providers: [
    UserGroupService,
    UserGroupModel
  ]
})
export class UserGroupModule {}
