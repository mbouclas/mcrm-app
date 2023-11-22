import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { UserService } from "~user/services/user.service";
import { UserModel } from "~user/models/user.model";
import { NotificationsService } from "~eshop/customer/services/notifications.service";

@Injectable()
export class EmailListeners {
  @OnEvent(UserService.createdEventName)
  async onUserCreated(user: UserModel) {
    // we only care about guest users
    if (user.type !== 'guest') {
      return;
    }

    await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'created' } );
  }

  @OnEvent(UserService.userVerifiedEventName)
  async onUserVerified(user: UserModel) {
    await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'verified' } );
  }

  @OnEvent(UserService.passwordResetEventName)
  async onUserPasswordReset(user: UserModel) {
    await NotificationsService.queue.add(NotificationsService.queueName, { user, type: 'resetPassword' } );
  }
}

