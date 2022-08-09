import { Injectable } from '@nestjs/common';
import { BaseNeoTreeService } from "~shared/services/base-neo-tree.service";
import { ChangeLogService } from "~change-log/change-log.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IsNotEmpty } from "class-validator";
import { ITag, TagService } from "~tag/services/tag.service";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";
import { PropertyService } from "~catalogue/property/property.service";
import { BaseModel } from "~models/base.model";
import {groupBy} from 'lodash';
import { combine } from "~helpers/array-permutations";
import { tokenGenerator } from "~helpers/tokenGenerator";
import { ProductVariantModel } from "~catalogue/product/models/product-variant.model";

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
}

@Injectable()
export class ProductService extends BaseNeoTreeService {
  protected changeLog: ChangeLogService;
  static updatedEventName = 'product.model.updated';
  static createdEventName = 'product.model.created';
  static deletedEventName = 'product.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.Product;
    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
/*    const s = new ProductService();
    const r = await s.findOne({slug: 'betty'}, [
      'properties',
      'variants',
    ]);*/
/*    const r = await s.generateVariantsFromProperty('e3b39b18-1a7a-4374-8d09-93f1fad349a1', [
      'a094c109-2adf-4ef8-ab19-aac83033ed6a',//red
      '616bce82-457a-4547-b56c-f80d81a13c7a',//blue
      '7afde04d-3c9b-4b13-b504-dff3f9b45472',//medium
      '6bbe2127-58ff-4e24-92a2-30ab15d77a8b',//large
    ])*/
    // const r = await s.find({limit: 2}, ['variants', 'properties'])
    // console.log(r)
  }

  async store(record: ProductModelDto, userId?: string) {
    const r = await super.store(record, userId);
    // Add changelog?

    return r;
  }

  async update(uuid:string, record:ProductModelDto, userId?:string) {
    // Handle SKU
    if (!record.sku) {
        record.sku = tokenGenerator(6);
    }

    // Handle Categories
    if (Array.isArray(record.categories)) {
      const productCategoryService = new ProductCategoryService();
      // await productCategoryService.
    }

    // Handle Tags
    if (Array.isArray(record.tags)) {
      // await
      const tagService = new TagService();
      await tagService.updateModelTags(uuid, record.tags, this.model.modelConfig);
    }

    // Handle properties

    // Handle images

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
    const product = await this.findOne({uuid});
    const propertyService = new PropertyService();
    // group propertyValues by properties to create unique arrays to get the permutations

    const values = await propertyService.getValues(propertyValues, true);
    const grouped = groupBy(values, 'property.slug');
    const all = [];
    for (let key in grouped) {
      all.push(grouped[key].map(g => g.name));
    }

    const variants = combine(all as any);
    for (let idx = 0; variants.length > idx; idx++) {
      await this.generateVariant(product, variants[idx], `${product['sku']}.${idx}`);
    }

    return this;
  }

  async generateVariant(product: BaseModel, variantName: string, variantId: string) {
    // attach an isVariant property and a rel to the parent product. The variant needs a rel to that value only. All other rels need to be inherited
    const query = `MATCH (product:Product {uuid: $uuid})
    MERGE (variant:ProductVariant {name:$variantName}) set variant.price = product.price, variant.title = product.title, variant.quantity = product.quantity, variant.variantId = $variantId,
    variant.active = true, variant.created_at = datetime()
    WITH product,variant
    MERGE (product)-[r:HAS_VARIANTS]->(variant)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    
    return *;
    `

    const res = this.neo.write(query, {variantName, variantId, uuid: product['uuid']});

    return res;
  }
}
