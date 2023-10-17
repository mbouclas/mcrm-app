import { BaseExecutor } from "~website/executors/base-executor";
import { IGenericObject } from "~models/general";
import { ProductService } from "~catalogue/product/services/product.service";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { OnEvent } from "@nestjs/event-emitter";
import { ClientModule } from "~root/client/client.module";
import { Injectable } from "@nestjs/common";
import { z } from "zod";

const settingsSchema = z.object({
  limit: z.number().describe('json:{"label": "Limit", "placeholder": "Limit", "hint": "Limit number of records", "type": "number", "default": 5}'),
  sortBy: z.string().describe('json:{"label": "Sort By", "placeholder": "Sort By", "hint": "Sort By", "type": "select", "options": [{"label": "Created At", "value": "createdAt", "default": true},{"label": "Title", "value": "title"}, {"label": "Price", "value": "price"}]}'),
  way: z.string().describe('json:{"label": "Way", "placeholder": "Way", "hint": "Way", "type": "select", "options": [{"label": "Ascending", "value": "asc"}, {"label": "Descending", "value": "desc", "default": true}]}'),
  rels: z.array(z.string()).describe('json:{"label": "Relationships", "placeholder": "Relationships", "hint": "Any field relationships. Use * for all, empty for none", "type": "text"}'),
});

type ISettingsConfig = z.infer<typeof settingsSchema>;

@McmsDi({
  id: 'LatestProductsExecutor',
  description: 'Fetch the latest products',
  type: 'executor',
  category: 'editableRegions',
  metaData: {
    name: 'Latest Products',
  }
})
@Injectable()
export class LatestProductsExecutor extends BaseExecutor {
  public static moduleRef;
  static settingsSchema = settingsSchema;

  onApplicationBootstrap() {
    LatestProductsExecutor.moduleRef = ClientModule.moduleRef;
  }

  async handle(settings: ISettingsConfig) {
    const limit = settings.limit || 5;
    const rels = settings.rels || [];
    let res;

    try {
      res = await (new ProductService()).find({limit, orderBy: settings.sortBy || 'createdAt', way: settings.way || 'DESC'}, rels);
    }
    catch (e) {
      console.log(`Error in LatestProductsExecutor: ${e.message}`);

      return [];
    }

    return res.data;
  }
}
