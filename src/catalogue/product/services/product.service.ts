import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { IsNotEmpty } from 'class-validator';
import { ITag } from '~tag/services/tag.service';
import { ProductCategoryModel } from '~catalogue/product/models/product-category.model';
import { PropertyService } from '~catalogue/property/services/property.service';
import { BaseModel } from '~models/base.model';
import { groupBy } from 'lodash';
import { combine } from '~helpers/array-permutations';
import { tokenGenerator } from '~helpers/tokenGenerator';
import { ProductVariantModel } from '~catalogue/product/models/product-variant.model';
import { BaseNeoService, IBaseNeoServiceRelationships } from '~shared/services/base-neo.service';
import { ProductModel } from '~catalogue/product/models/product.model';
import { IBaseFilter, IGenericObject, IPagination } from '~models/general';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { ImageService } from '~image/image.service';
import { RecordUpdateFailedException } from '~shared/exceptions/record-update-failed-exception';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { getHooks } from '~shared/hooks/hook.decorator';
import { SharedModule } from '~shared/shared.module';
const slug = require('slug');
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

export enum ProductEventNames {
  productCreated = 'productCreated',
  productUpdated = 'productUpdated',
  productDeleted = 'productDeleted',
  bulkUpdate = 'bulkUpdate',
  productImportDone = 'productImportDone',
}

@McmsDi({
  id: 'ProductService',
  type: 'service',
})
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
    /*    const s = new ProductService();
    let n;
    try {
      n = await s.findOne({uuid: 'a03f3e4e-f053-4531-b96c-f5e4a3e4d1da'});
    }
    catch (e) {
      console.log(e);
      console.log(e.getQuery());
    }*/
    /*    try {
      console.log((new PermalinkBuilderService()).build('Product', n))
    }
    catch (e) {
      console.log(e)
    }*/
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
    let item: ProductModel;
    const hooks = getHooks({ category: 'Product' });

    if (hooks && typeof hooks.findOneBefore === 'function') {
      await hooks.findOneBefore(filter, rels);
    }

    try {
      item = (await super.findOne(filter, rels)) as unknown as ProductModel;
    } catch (e) {
      throw e;
    }


    if (!item['thumb'] || !item['thumb']?.url) {
      const images = await this.imageService.getItemImages('Product', item['uuid']);
      item['thumb'] = images.find((img) => img.type === 'main') || null;
    }


    if (hooks && typeof hooks.findOneAfter === 'function') {
      item = await hooks.findOneAfter(item);
    }

    return item;
  }

  async find(params: IGenericObject = {}, rels: string[] = []): Promise<IPagination<ProductModel>> {
    let res;
    try {
      res = await super.find(params, rels);
    } catch (e) {
      throw e;
    }

    return res;
  }

  async store(record: ProductModelDto, userId?: string, relationships: IBaseNeoServiceRelationships[] = []) {
    const hooks = getHooks({ category: 'Product' });

    if (hooks && typeof hooks.storeBefore === 'function') {
      await hooks.storeBefore(record, relationships);
    }
    // Handle SKU
    if (!record.sku) {
      record.sku = tokenGenerator(6);
    }

    let r = await super.store(record, userId, relationships);
    // Add changelog?

    if (hooks && typeof hooks.storeAfter === 'function') {
      r = await hooks.storeAfter(r);
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productCreated, r);
    return r;
  }

  async update(
    uuid: string,
    record: IGenericObject,
    userId?: string,
    relationships?: Array<{
      id: string;
      name: string;
      relationshipProps?: IGenericObject;
    }>,
    options?: IGenericObject,
  ): Promise<ProductModel> {
    const hooks = getHooks({ category: 'Product' });
    if (hooks && typeof hooks.updateBefore === 'function') {
      await hooks.updateBefore(record, relationships);
    }

    try {
      let r = await super.update(uuid, record, userId, relationships, options);

      if (hooks && typeof hooks.updateAfter === 'function') {
        r = await hooks.updateAfter(r);
      }

      SharedModule.eventEmitter.emit(ProductEventNames.productUpdated, { uuid, ...record });

      return r;
    } catch (e) {
      console.log(`ERROR UPDATING PRODUCT:`, e);
      throw new RecordUpdateFailedException(e);
    }
  }

  async delete(uuid: string, userId?: string) {
    const hooks = getHooks({ category: 'Product' });
    if (hooks && typeof hooks.deleteBefore === 'function') {
      await hooks.deleteBefore(uuid);
    }

    try {
      await super.delete(uuid, userId);
    } catch (e) {
      console.log(`ERROR DELETING PRODUCT:`, e);
      throw new RecordUpdateFailedException(e);
    }

    if (hooks && typeof hooks.deleteAfter === 'function') {
      await hooks.deleteAfter(uuid);
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productDeleted, uuid);
    return { success: true };
  }

  /**
   * Given a property and it's values, generate product variants.
   * For example, generate variants for the colors blue and black.
   * The variants are links to the product that the user can edit their prices, quantities etc
   * Variants are generated as combos. If we select color + size, then we get variants like Red - SM, Red - M, Red - L
   * Variants are included in the product model but are not shown on search results
   * @param uuid
   * @param propertyValues
   * @param duplicateVariants
   */
  async generateVariantsFromProperty(uuid: string, propertyValues: string[], duplicateVariants: IGenericObject) {
    const product = await this.findOne({ uuid });
    const propertyService = new PropertyService();
    // group propertyValues by properties to create unique arrays to get the permutations

    const values = await propertyService.getValues(propertyValues, true);
    const grouped = groupBy(values, 'property.slug');
    const all = [];
    for (const key in grouped) {
      all.push(grouped[key].map((g) => g.name));
    }

    const variants = combine(all as any, ' ::: ');

    const existingVariantCountQuery = await (new ProductVariantService()).find({sku: product['sku']});
    let existingVariantCount = existingVariantCountQuery.total;

    for (let idx = 0; variants.length > idx; idx++) {
      const variant = variants[idx];
      if (!duplicateVariants.hasOwnProperty(variant) || duplicateVariants[variant] === false) {
        await this.generateVariant(product, variant, `${product['sku']}.${existingVariantCount++}`, values);
      }
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productUpdated, {uuid});
    return this;
  }

  async checkDuplicateVariants(uuid: string, propertyValues: string[]) {
    const product = await this.findOne({ uuid });
    const productVariantService = new ProductVariantService();
    const propertyService = new PropertyService();

    const values = await propertyService.getValues(propertyValues, true);
    const grouped = groupBy(values, 'property.slug');
    const all = [];
    for (const key in grouped) {
      all.push(grouped[key].map((g) => g.name));
    }

    const variantNames = combine(all as any, ' ::: ', product['sku']);

    const foundVariants = await productVariantService.getVariantsByNames(variantNames);

    const duplicateVariantNames = foundVariants.map((variant) => variant.name);

    const newVariantNames = variantNames.filter((name) => !duplicateVariantNames.includes(name));

    return {
      newVariantNames,
      duplicateVariantNames,
    };
  }

  /**
   * Used by generateVariantsFromProperty to create a single variant
   * @param product
   * @param variantName
   * @param variantId
   */
  async generateVariant(product: BaseModel, variantName: string, variantId: string, propertyValues: IGenericObject[]) {
    // attach an isVariant property and a rel to the parent product. The variant needs a rel to that value only. All other rels need to be inherited
    const query = `
    MATCH (product:Product {uuid: $uuid})
    MERGE (variant:ProductVariant {name:$variantName}) SET 
      variant.price = product.price, 
      variant.title = product.title, 
      variant.quantity = product.quantity, 
      variant.thumb = product.thumb,
      variant.sku = product.sku,
      variant.variantId = $variantId,
      variant.active = true, 
      variant.createdAt = datetime()
    WITH product,variant
    MERGE (product)-[r:HAS_VARIANTS]->(variant)
    ON CREATE SET r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    
    return *;
    `;


    await this.neo.write(query, {
      variantName,
      variantId,
      uuid: product['uuid'],
    });

    const res = await (new ProductVariantService()).findOne({ variantId });

    const variantUuid = res['uuid'];
    // add relationship to the property value and the property
/*    const relQuery = `
    UNWIND $propertyValues as propertyValue
    MATCH (variant:ProductVariant {uuid: $variantUuid})
    MATCH (propValue:PropertyValue {uuid:propertyValue.uuid})<-[:HAS_VALUE]-(property:Property {uuid: propertyValue.propertyUuid})
    MERGE (variant)-[r:HAS_PROPERTY_VALUE]->(propValue)
    ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET   r.updatedAt = datetime()
    WITH variant, propertyValue, property
    MERGE (variant)-[r2:HAS_PROPERTY]->(property)
    ON CREATE SET  r2.updatedAt = datetime(), r2.createdAt = datetime()
    ON MATCH SET   r2.updatedAt = datetime()
    return *;
    `;*/
    const propertyValueFound = propertyValues.find(p => p.name === variantName);
    const propertyValue = {...propertyValueFound, propertyUuid: propertyValueFound.property.uuid};
    const setQuery = [];
    if (propertyValueFound.property.type === 'color') {
      setQuery.push(`variant.color = $propertyValue.code`);
    }

    const relQuery = `
    MATCH (variant:ProductVariant {uuid: $variantUuid}) ${setQuery.length > 0 ? `SET ${setQuery.join(', ')}` : ''}
    WITH *
    MATCH (propValue:PropertyValue {uuid:$propertyValue.uuid})<-[:HAS_VALUE]-(property:Property {uuid: $propertyValue.propertyUuid})
    MERGE (variant)-[r:HAS_PROPERTY_VALUE]->(propValue)
    ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET   r.updatedAt = datetime()
    WITH *
    MERGE (variant)-[r2:HAS_PROPERTY]->(property)
    ON CREATE SET  r2.updatedAt = datetime(), r2.createdAt = datetime()
    ON MATCH SET   r2.updatedAt = datetime()
    WITH *
    MATCH (product:Product {uuid: $productUuid})
    MERGE (product)-[rp1:HAS_PROPERTY_VALUE]->(propValue)
    ON CREATE SET  rp1.updatedAt = datetime(), rp1.createdAt = datetime()
    ON MATCH SET   rp1.updatedAt = datetime()
    WITH *
    MERGE (product)-[rp2:HAS_PROPERTY]->(property)
    ON CREATE SET  rp2.updatedAt = datetime(), rp2.createdAt = datetime()
    ON MATCH SET   rp2.updatedAt = datetime()
    return *;
    `;


    try {
      await this.neo.write(relQuery, {
        variantUuid,
        propertyValues: propertyValues.map(p => ({uuid: p.uuid, propertyUuid: p.property.uuid})),
        propertyValue,
        productUuid: product['uuid'],
      });
    }
    catch (e) {
      console.log(`Error creating variant relationships: ${e}`);
    }

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

  async addRelated(sourceFilter: IBaseFilter, destinationFilter: IBaseFilter) {
    try {
      await this.attachToModel(sourceFilter, destinationFilter, 'related');
    } catch (e) {
      console.log(e);
    }

    return this;
  }

  async removeRelated(sourceFilter: IBaseFilter, destinationModelName: string, destinationFilter: IBaseFilter) {
    const rel = store.getState().models['Product'].modelConfig.relationships['related'].rel;
    await this.detachOneModelFromAnother('Product', sourceFilter, destinationModelName, destinationFilter, rel);
  }

  static findVariant(product: ProductModel, filter: IBaseFilter) {
    if (!Array.isArray(product['variants'])) {
      return null;
    }

    const { key, value } = extractSingleFilterFromObject(filter);

    return product['variants'].find((item) => item[key] === value);
  }

  async updateProductCategories(uuid: string, ids: string[]) {
    try {
      await this.neo.write(
        `
            MATCH (p:Product {uuid: $uuid})-[r:HAS_CATEGORY]->(c:ProductCategory)
      DETACH DELETE r
      return *;
      `,
        {
          uuid,
        },
      );
    } catch (e) {
      console.log(`Error reseting product categories: ${e}`);
      throw new RecordUpdateFailedException(e);
    }

    const query = `
      UNWIND $ids as id
      MATCH (p:Product {uuid: $uuid})
      MATCH (c:ProductCategory {uuid: id})
      MERGE (p)-[r:HAS_CATEGORY]->(c)
      ON CREATE SET r.createdAt = datetime()
      ON MATCH SET r.updatedAt = datetime()
      return *;
    `;

    try {
      await this.neo.write(query, {
        uuid,
        ids,
      });
    } catch (e) {
      console.log(`Error updating product categories: ${e}`);
      throw new RecordUpdateFailedException(e);
    }

    return this;
  }
}
