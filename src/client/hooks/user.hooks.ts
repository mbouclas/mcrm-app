import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { ICheckoutStore } from "~eshop/models/checkout";
import { SessionData } from "express-session";
import { OnEvent } from "@nestjs/event-emitter";
import { ClientModule } from "~root/client/client.module";
import { RegisterGuestDto } from "~root/auth/controllers/regular-user.controller";
import { UserModel } from "~user/models/user.model";

@McmsDi({
  id: 'UserHooks',
  type: 'class',
})
@Injectable()
export class UserHooks {
  public static moduleRef;
  @OnEvent('app.loaded')
  async onAppLoaded() {
    UserHooks.moduleRef = ClientModule.moduleRef;
  }

  async beforeUserValidation(user: RegisterGuestDto) {
    return user;
  }

  async afterUserValidation(user: RegisterGuestDto) {

  }

  async beforeUserCreate(user: RegisterGuestDto) {

  }

  async afterUserCreate(user: UserModel) {

  }

  async beforeUserUpdate(user: UserModel) {

  }

  async afterUserUpdate(user: UserModel) {

  }

  async beforeUserDelete(user: UserModel) {

  }

  async afterUserDelete(user: UserModel) {

  }
}
