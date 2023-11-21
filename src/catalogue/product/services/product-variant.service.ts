import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductVariantModel } from "~catalogue/product/models/product-variant.model";
import { getHooks } from "~shared/hooks/hook.decorator";
import { IGenericObject } from "~models/general";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";
import { SharedModule } from "~shared/shared.module";
import { ProductEventNames, ProductService } from "~catalogue/product/services/product.service";

@Injectable()
export class ProductVariantService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.ProductVariant;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() { }

  async update(uuid: string, record: Partial<ProductVariantModel>) {
    const hooks = getHooks({ category: 'ProductVariant' });
    if (hooks && typeof hooks.updateBefore === 'function') {
      await hooks.updateBefore(record);
    }
    let r;
    try {
      r = await super.update(uuid, record);

      if (hooks && typeof hooks.updateAfter === 'function') {
        r = await hooks.updateAfter(r);
      }

      let product;
      if (record.sku) {
        product = await new ProductService().findOne({ sku: record.sku }, ['*']);
      } else {
        // partial update
        const v = await this.findOne({ uuid }, ['*']) as ProductVariantModel;
        product = await new ProductService().findOne({ sku: v.sku }, ['*']);
      }

      SharedModule.eventEmitter.emit(ProductEventNames.productUpdated, product);
      return r;
    }
    catch (e) {
      console.log(`ERROR UPDATING PRODUCTVariant:`, e);
      throw new RecordUpdateFailedException(e);
    }
  }

  async getVariantsByNames(variantNames: string[]) {
    const query = `
    MATCH (variant:ProductVariant)
    WHERE variant.name IN $names
    RETURN variant;
  `;

    const res = await this.neo.readWithCleanUp(query, { names: variantNames });

    return res.map((record) => record['variant']);
  }
}
