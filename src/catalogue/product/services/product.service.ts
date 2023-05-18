import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { IsNotEmpty } from 'class-validator';
import { ITag, TagService } from '~tag/services/tag.service';
import { ProductCategoryModel } from '~catalogue/product/models/product-category.model';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';
import { PropertyService } from '~catalogue/property/property.service';
import { BaseModel } from '~models/base.model';
import { groupBy } from 'lodash';
import { combine } from '~helpers/array-permutations';
import { tokenGenerator } from '~helpers/tokenGenerator';
import { ProductVariantModel } from '~catalogue/product/models/product-variant.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { ProductModel } from '~catalogue/product/models/product.model';
import { IBaseFilter, IGenericObject } from '~models/general';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { ImageService } from '~image/image.service';
import { RecordUpdateFailedException } from '~shared/exceptions/record-update-failed-exception';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';

export class ProductModelDto {
  tempUuid?: string;
  uuid?: string;

  @IsNotEmpty()
  title?: string;

  categories?: ProductCategoryModel[];
  tags?: ITag[];
  variants?: ProductVariantModel[];
  sku?: string;
  price?: number;
  quantity?: number;
  slug?: string;
  active?: boolean;
  deliverability?: {
    stock?: number;
    clearanceSale?: boolean;
  };

  seo?: {
    title?: string;
    descrtiption?: string;
    keywords?: string;
    og_title?: string;
    og_image?: string;
    og_description?: string;
  };
  measuresAndPackaging?: {
    width?: string;
    height?: string;
    length?: string;
    weight?: string;
    sellingUnit?: string;
    scaleUnit?: string;
    packagingUnit?: string;
    basicUnit?: string;
  };
}

@Injectable()
export class ProductService extends BaseNeoService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'product.model.updated';
  static createdEventName = 'product.model.created';
  static deletedEventName = 'product.model.deleted';
  protected imageService: ImageService;

  constructor() {
    super();
    this.model = store.getState().models.Product;

    this.changeLog = new ChangeLogService();
    this.imageService = new ImageService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    const s = new ProductService();
    /*
        const r = await s.findOne({slug: 'cretus'}, [
          // 'properties',
          // 'variants',
        ]);
        console.log(r)
    */
    /*    const r = await s.generateVariantsFromProperty('e3b39b18-1a7a-4374-8d09-93f1fad349a1', [
          'a094c109-2adf-4ef8-ab19-aac83033ed6a',//red
          '616bce82-457a-4547-b56c-f80d81a13c7a',//blue
          '7afde04d-3c9b-4b13-b504-dff3f9b45472',//medium
          '6bbe2127-58ff-4e24-92a2-30ab15d77a8b',//large
        ])*/
    // const r = await s.find({limit: 2}, ['variants', 'properties'])
    // console.log(r)

    // await s.removeRelated({slug: 'betty'}, 'Product', {slug: 'trebol'})
  }

  async findOne(filter: IGenericObject, rels = []): Promise<ProductModel> {
    const item = (await super.findOne(filter, rels)) as unknown as ProductModel;
    item['images'] = await this.imageService.getItemImages(
      'Product',
      item['uuid'],
    );
    item['thumb'] = item['images'].find((img) => img.type === 'main') || null;

    return item;
  }

  async store(record: ProductModelDto, userId?: string) {
    // Handle SKU
    if (!record.sku) {
      record.sku = tokenGenerator(6);
    }

    const r = await super.store(record, userId);
    // Add changelog?

    return r;
  }

  async update(uuid: string, record: ProductModelDto, userId?: string) {

    const r = await super.update(uuid, record, userId);
    // Handle Categories
    if (Array.isArray(record.categories)) {
      const productCategoryService = new ProductCategoryService();
      // await productCategoryService.
    }

    // Handle Tags
    if (Array.isArray(record.tags)) {
      // await
      const tagService = new TagService();
      await tagService.updateModelTags(
        uuid,
        record.tags,
        this.model.modelConfig,
      );
    }

    // Handle properties

    // Handle images
    return r;
  }

  /**
   * Given a property and it's values, generate product variants.
   * For example, generate variants for the colors blue and black.
   * The variants are links to the product that the user can edit their prices, quantities etc
   * Variants are generated as combos. If we select color + size, then we get variants like Red - SM, Red - M, Red - L
   * Variants are included in the product model but are not shown on search results
   * @param uuid
   * @param propertyValues
   */
  async generateVariantsFromProperty(uuid: string, propertyValues: string[]) {
    const product = await this.findOne({ uuid });
    const propertyService = new PropertyService();
    // group propertyValues by properties to create unique arrays to get the permutations

    const values = await propertyService.getValues(propertyValues, true);
    const grouped = groupBy(values, 'property.slug');
    const all = [];
    for (let key in grouped) {
      all.push(grouped[key].map((g) => g.name));
    }

    const variants = combine(all as any);
    for (let idx = 0; variants.length > idx; idx++) {
      await this.generateVariant(
        product,
        variants[idx],
        `${product['sku']}.${idx}`,
      );
    }

    return this;
  }

  /**
   * Used by generateVariantsFromProperty to create a single variant
   * @param product
   * @param variantName
   * @param variantId
   */
  async generateVariant(
    product: BaseModel,
    variantName: string,
    variantId: string,
  ) {
    // attach an isVariant property and a rel to the parent product. The variant needs a rel to that value only. All other rels need to be inherited
    const query = `MATCH (product:Product {uuid: $uuid})
    MERGE (variant:ProductVariant {name:$variantName}) set variant.price = product.price, variant.title = product.title, variant.quantity = product.quantity, variant.variantId = $variantId,
    variant.active = true, variant.createdAt = datetime()
    WITH product,variant
    MERGE (product)-[r:HAS_VARIANTS]->(variant)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    
    return *;
    `;

    const res = this.neo.write(query, {
      variantName,
      variantId,
      uuid: product['uuid'],
    });

    return res;
  }

  async editVariant(variantFilter: IBaseFilter, data: any) {
    const filter = extractSingleFilterFromObject(variantFilter);
    const s = new ProductVariantService();
    const variant = s.findOne(variantFilter);
    return await s.update(variant['uuid'], data);
  }

  async removeVariant(productFilter: IBaseFilter, variantFilter: IBaseFilter) {
    const filter = extractSingleFilterFromObject(variantFilter);

    const query = `
      MATCH (n:ProductVariant {${filter.key}: '${filter.value}'})
      DETACH DELETE n;
    `;

    try {
      await this.neo.write(query);
    } catch (e) {
      throw new RecordUpdateFailedException(e);
    }

    return this;
  }

  async addRelated(
    sourceFilter: IBaseFilter,
    destinationModelName: string,
    destinationFilter: IBaseFilter,
  ) {
    try {
      await this.attachModelToAnotherModel(
        store.getState().models['Product'],
        sourceFilter,
        store.getState().models[destinationModelName],
        destinationFilter,
        'related',
      );
    } catch (e) {
      console.log(e);
    }

    return this;
  }

  async removeRelated(
    sourceFilter: IBaseFilter,
    destinationModelName: string,
    destinationFilter: IBaseFilter,
  ) {
    const rel =
      store.getState().models['Product'].modelConfig.relationships['related']
        .rel;
    await this.detachOneModelFromAnother(
      'Product',
      sourceFilter,
      destinationModelName,
      destinationFilter,
      rel,
    );
  }

  static findVariant(product: ProductModel, filter: IBaseFilter) {
    if (!Array.isArray(product['variants'])) {
      return null;
    }

    const { key, value } = extractSingleFilterFromObject(filter);

    return product['variants'].find((item) => item[key] === value);
  }
}
