import { NotificationsService } from "~eshop/customer/services/notifications.service";
import { UserModel } from "~user/models/user.model";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { ClientModule } from "~root/client/client.module";
import { OnEvent } from "@nestjs/event-emitter";

@McmsDi({
  id: 'CustomerNotificationsExecutor',
  type: 'class',
})
@Injectable()
export class CustomerNotificationsExecutor extends NotificationsService {
  public static moduleRef;
  @OnEvent('app.loaded')
  async onAppLoaded() {
    CustomerNotificationsExecutor.moduleRef = ClientModule.moduleRef;
  }

  async onModuleInit() {

  }
  async sendWelcomeEmail(user: UserModel) {
    console.log('In custom executor', user)
  }
}
