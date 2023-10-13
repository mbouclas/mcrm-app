import { ProductModel } from "~catalogue/product/models/product.model";
import { IProductModelEs } from "~catalogue/export/sync-elastic-search.service";
import { IPagination } from "~models/general";
import { PropertyModel } from "~catalogue/property/models/property.model";
import { getHooks } from "~shared/hooks/hook.decorator";

/**
 * @Hook beforeStart. This hook is called before the conversion starts
 * @Hook beforeReturn. This hook is called before the conversion returns the result
 *
 * @param product
 */
export class BaseProductConverterService {
  constructor(protected properties: IPagination<PropertyModel>) {}

  async convert(product: ProductModel): Promise<IProductModelEs> {
    let result: IProductModelEs = {} as IProductModelEs;
    const hooks = getHooks({ category: 'EsProductConverter' });

    if (hooks && typeof hooks.beforeStart === 'function') {
      product = await hooks.beforeStart(product);
    }

    if (hooks && typeof hooks.beforeReturn === 'function') {
      result = await hooks.beforeReturn(product, result);
    }

    return result;
  }
}
