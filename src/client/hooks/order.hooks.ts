import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { ICheckoutStore } from "~eshop/models/checkout";
import { SessionData } from "express-session";
import { OnEvent } from "@nestjs/event-emitter";
import { ClientModule } from "~root/client/client.module";

@McmsDi({
  id: 'OrderHooks',
  type: 'class',
})
@Injectable()
export class OrderHooks {
  public static moduleRef;
  @OnEvent('app.loaded')
  async onAppLoaded() {
    OrderHooks.moduleRef = ClientModule.moduleRef;
  }

  async beforeOrderValidation(order: ICheckoutStore, session: SessionData, ip: string, user: any) {

  }
  async beforeCreateOrder(order: ICheckoutStore, session: SessionData, ip: string, user: any) {

  }

}
