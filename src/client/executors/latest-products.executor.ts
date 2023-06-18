import { BaseExecutor } from "~website/executors/base-executor";
import { IGenericObject } from "~models/general";
import { ProductService } from "~catalogue/product/services/product.service";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { OnEvent } from "@nestjs/event-emitter";
import { ClientModule } from "~root/client/client.module";
import { Injectable } from "@nestjs/common";

@McmsDi({
  id: 'LatestProductsExecutor',
  type: 'class',
})
@Injectable()
export class LatestProductsExecutor extends BaseExecutor {
  public static moduleRef;

  @OnEvent('app.loaded')
  async onAppLoaded() {
    LatestProductsExecutor.moduleRef = ClientModule.moduleRef;
  }

  async handle(settings: IGenericObject) {
    const limit = settings.limit || 5;
    const rels = settings.rels || [];
    let res;

    try {
      res = await (new ProductService()).find({limit, orderBy: 'createdAt', way: 'DESC'}, rels);
    }
    catch (e) {
      console.log(`Error in LatestProductsExecutor: ${e.message}`);

      return [];
    }

    return res.data;
  }
}
