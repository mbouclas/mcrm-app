import { Injectable } from '@nestjs/common';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProductVariantService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.ProductVariant;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() { }

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
