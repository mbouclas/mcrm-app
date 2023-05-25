import { ProductModel } from '../product/models/product.model';
import { IProductModelEs, IPropertyEs, IVariantEs } from '~catalogue/export/sync-elastic-search.service';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';
import { IPagination } from '~models/general';
import { PropertyModel } from '~catalogue/property/models/property.model';
const slugify = require('slug');

export class ProductConverterService {
  constructor(protected properties: IPagination<PropertyModel>) {}
  async convert(product: ProductModel) {
    const result: IProductModelEs = {} as IProductModelEs;
    if (product.sku === 'R7200') {
      console.log(product);
    }

    result.sku = product.sku;
    result.slug = product.slug;
    result.title = product.title;
    result.id = product.uuid;
    result.price = product.price;
    result.thumb = product['thumb'];
    result.description = product.description;
    result.createdAt = product['createdAt'];
    result.updatedAt = product['updatedAt'];

    if (Array.isArray(product['property'])) {
      result.properties = [];
      product['property'].forEach((property) => {
        if (!Array.isArray(property.values) || property.values.length === 0) {
          return [];
        }
        let ret;

        property['values'].forEach((value) => {
          ret = {
            propertyUuid: property.uuid,
            propertyName: property.title,
            type: property.type,
            propertySlug: property.slug,
          };
          if (value.code) {
            ret.code = value.code;
          }

          if (value.image) {
            ret.image = value.image;
          }

          if (value.color) {
            ret.color = value.color;
          }

          ret.slug = value.slug;
          ret.uuid = value.uuid;
          ret.name = value.name;

          result.properties.push(ret);
        });
      });
    }

    if (Array.isArray(product['variants'])) {
      result.variants = product['variants'].map((variant) => {
        const item = {
          uuid: variant.uuid,
          title: variant.name.length > 0 ? variant.name : product.title,
          slug: `${product.slug}-${slugify(variant.variantId, { lower: true })}`,
          price: variant.price,
          sku: variant.sku,
          variantId: variant.variantId,
          image: variant.thumb || null,
        } as unknown as IVariantEs;

        this.properties.data.forEach((property) => {
          if (variant[property['slug']]) {
            item[property['slug']] = variant[property['slug']];
          }
        });

        return item;
      });
    }

    if (Array.isArray(product['tags'])) {
    }

    if (Array.isArray(product['images'])) {
      result.images = product['images'].map((image) => ({
        uuid: image.uuid,
        url: image.url,
        caption: image.caption,
        alt: image.alt,
        title: image.title,
      }));
    }

    if (Array.isArray(product['productCategory'])) {
      result['categories'] = [];

      const catService = new ProductCategoryService();

      for (let idx = 0; idx < product['productCategory'].length; idx++) {
        const category = product['productCategory'][idx];
        result.categories.push({
          uuid: category.uuid,
          title: category.title,
          slug: category.slug,
        });
        // Add any parent categories in the list. This way the front end can display products on every level and the counts from top to bottom of the tree will be more accurate
        const ancestors = await catService.findAncestors(category.uuid);
        ancestors.forEach((ancestor) => {
          result.categories.push({
            uuid: ancestor.uuid,
            title: ancestor.title,
            slug: ancestor.slug,
          });
        });
        // Add any children categories in the list. This way the front end can display products on every level and the counts from top to bottom of the tree will be more accurate
        const descendants = await catService.findDescendants(category.uuid);
        descendants.forEach((cat) => {
          result.categories.push({
            uuid: cat.uuid,
            title: cat.title,
            slug: cat.slug,
          });
        });
      }
    }

    return result;
  }
}
