import {
  ImportTemplateField,
  ImportTemplateRegistry,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import {
  BaseImportService,
  IBaseImportServiceSettings,
  IBaseProcessorResult,
  IBaseProcessorSchema
} from "~catalogue/import/services/base-import.service";
import { z } from "zod";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
import { PropertyModel } from "~catalogue/property/models/property.model";
import { IPropertyValueWithProperty, PropertyService } from "~catalogue/property/services/property.service";
import { ProductEventNames, ProductService } from "~catalogue/product/services/product.service";
import { ProductVariantService } from "~catalogue/product/services/product-variant.service";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";
import slug from "slug";
import { store } from "~root/state";
import { uniqBy } from "lodash";
import { SalesChannelsService } from "~sales-channels/sales-channels.service";
import { SharedModule } from "~shared/shared.module";
import { ImportProductPhotosService } from "~catalogue/import/services/import-product-photos.service";
import { TagService } from "~tag/services/tag.service";
import { OnEvent } from "@nestjs/event-emitter";

interface IDataFormat extends IBaseProcessorSchema {
  title: string;
  sku: string;
  description: string;
  description_long: string;
  price: number;
  image: string;
  categories: string[];
  properties: { key: string, value: any }[];
  assignedProperties: string[];
  allProperties: any[];
  tags: string[];
  salesChannel: string;
}

export interface IProcessedResult extends IBaseProcessorResult {
  data: Partial<IDataFormat>[];

}



export const settings: Partial<IBaseImportServiceSettings> = {
  skipExistingProducts: true,
  imageProcessorTemplate: 'AddImagesToProductsTemplate',
};

export const settingsSchema = z.object({
  skipExistingProducts: z.boolean().describe(`json:{"label": "Skip existing products", "placeholder": "Skip existing products", "hint": "Skip importing products that already exist", "default": true}`),
});

setTimeout(() => {
  const imageTemplateProcessors = ImportTemplateRegistry.filter({type: 'images'}).map(t => ({
    value: t.id,
    label: t['name'],
    hint: t.description,
    default: t['name'] === 'AddImagesToProductsTemplate'
  }));

  ImportProductsTemplate.settingsSchema = settingsSchema.extend({
    imageProcessorTemplate: z.string().describe(`json:{"label": "Image Processor Template Name", "placeholder": "Image Processor Template Name", "hint": "Which Processor to use for images", "type":"select", "options": ${JSON.stringify(imageTemplateProcessors)}}`),
  });

}, 2000);

@McrmImportTemplate({
  id: "ImportProductsTemplate",
  name: "Import Products",
  description: "Bulk import products based on an input CSV file",
  type: "products"
})
@Injectable()
export class ImportProductsTemplate extends BaseImportService {
  static settingsSchema = settingsSchema;
  static settings: Partial<IBaseImportServiceSettings> = settings;

  @ImportTemplateField({
    name: "title",
    importFieldName: "title",
    required: true,
    isSlugFor: "slug",
    type: "text",
    description: "The product title"
  })
  public title: string;

  @ImportTemplateField({
    name: "sku",
    importFieldName: "sku",
    required: true,
    type: "text",
    description: "The SKU of the product to update"
  })
  public sku: string;

  @ImportTemplateField({
    name: "description",
    importFieldName: "description",
    required: false,
    type: "text",
    description: "The short description of the product"
  })
  public description: string;

  @ImportTemplateField({
    name: "description_long",
    importFieldName: "description_long",
    required: false,
    type: "text",
    description: "The long description of the product"
  })
  public description_long: string;

  @ImportTemplateField({
    name: "price",
    importFieldName: "price",
    required: true,
    type: "price",
    description: "product price. Should be a number",
    priceOnRequestFlag: "P.O.R."
  })
  public price: number;

  @ImportTemplateField({
    name: "image",
    importFieldName: "image",
    required: false,
    type: "image",
    description: "The product image. Should be a URL to the image"
  })
  public image: string;

  @ImportTemplateField({
    name: "tags",
    importFieldName: "tags",
    required: false,
    type: "tag",
    description: `A semi-colon separated list of tags to apply to the product.<br> Caution: if the tag does not exist, it will be created`,
    settings: { separator: ";", removeExisting: false },
    fieldSettingsConfig: [
      {
        varName: "separator",
        type: "text",
        label: "Tag separator",
        placeholder: "Tag separator",
        hint: "The character used to separate tags in the CSV file",
        default: ";"
      },
      {
        varName: "removeExisting",
        type: "boolean",
        label: "Remove existing tags",
        placeholder: "Remove existing tags",
        hint: "If true, existing tags will be removed before applying the new tags",
        default: false
      }
    ]
  })
  tags: string;

  @ImportTemplateField({
    name: "salesChannel",
    importFieldName: "salesChannel",
    required: false,
    type: "text",
    description: "The sales channel to assign the product to. If not specified, the product will be assigned to the default sales channel"
  })
  public salesChannel: string;

  categories: ProductCategoryModel[] = [];
  protected properties: PropertyModel[] = [];
  protected propertyValues: IPropertyValueWithProperty[] = [];

/*  @OnEvent('app.loaded')
  async onAppLoaded() {
    setTimeout(async () => {
      const dummyFile = {
        fieldname: 'file',
        originalname: 'CLOTHING masterfile 2022.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        destination: 'I:\\Work\\mcms-node\\upload',
        filename: '5eec2a19d0d945fe4ef30f4139ae0095',
        path: 'I:\\Work\\mcms-node\\mcrm\\upload\\small-products-import.csv',
        size: 17760597,
      };

      try {
        const r = await new ImportProductsTemplate({
          settings: {
            skipExistingProducts: true,
          }
        }).process(dummyFile);

      }
      catch (e) {
        console.log(`Error processing file ${dummyFile.filename}`, e)
      }
    }, 1000)
  }*/

  async analyze(file: Partial<Express.Multer.File>): Promise<IBaseProcessorResult> {
    let res = await super.analyze(file);
    if (res.invalidRows.length > 0) {
      return res;
    }

    res.metaData = {};

    res = await this.processCheckForSimilarProducts(res);

    await this.pullAllCategories();
    await this.pullAllProperties();
    await this.pullAllPropertyValues();

    res = await this.runExtraTransformations(res);

    for (let idx = 0; res.data.length > idx; idx++) {
      const rowData = res.data[idx];
      rowData['productCategory'] = rowData['categories'].map(c => {
        return this.categories.find(cat => cat['uuid'] === c);
      });
    }

    res.validRows = res.data.length;
    return res;

  }

  async processCheckForSimilarProducts(res: IBaseProcessorResult) {
    const service = new ProductVariantService();

    if (this.settings && typeof this.settings["skipExistingProducts"] === 'boolean') {
      // check for duplicate products according to settings.skipExistingProducts
      const skus = new Set(res.data.map((row) => row["sku"]));
      const productsQuery = `
      MATCH (n:Product)
      WHERE n.sku IN $skus
      RETURN count(n) as count;
    `;

      const productsRes = await service.neo.readWithCleanUp(productsQuery, { skus: Array.from(skus) });
      if (productsRes[0].count > 0 && this.settings["skipExistingProducts"] === false) {
        res.skippedRows += productsRes[0].count;
        res.metaData["skippedProducts"] = productsRes[0];
        res.isInvalid = true;
      } else if (productsRes[0].count > 0 && this.settings["skipExistingProducts"] === true) {
        res.data.forEach(row => {
          const foundIndex = Array.from(skus).findIndex((sku) => sku === row['sku']);
          if (foundIndex !== -1) {
            res.data.splice(foundIndex, 1);
          }
        });

      }
    }

    return res;
  }

  async pullAllCategories() {
    const s = new ProductCategoryService();
    const res = await s.find({ limit: 200 });
    this.categories = res.data as ProductCategoryModel[];
  }


  async pullAllProperties() {
    const s = new PropertyService();
    const res = await s.find({ limit: 200 }, ['propertyValue']);
    this.properties = res.data as PropertyModel[];
  }

  async pullAllPropertyValues() {
    const s = new PropertyService();
    this.propertyValues = await s.getAllPropertyValues();

  }

  async runExtraTransformations(res: IBaseProcessorResult) {

    const categories = {};
    this.categories.forEach(c => {
      categories[c['slug']] = c;
    });


    const flatProperties = {};//create a map of values for performance reasons. This is infinitely faster than looping through the array
    this.propertyValues.forEach(v => {
      flatProperties[`${v.propertySlug}.${v.type === 'color' ? v.code : v.slug}`] = v;
    });

    let isInvalid = false
    const invalidFields = [];

    for (let idx = 0; res.data.length > idx; idx++) {
      const rowData = res.data[idx];
      const data = {
        categories: [],
        properties: [],
      };

      Object.keys(rowData)
        .filter(key => {
          return this.fieldMap.findIndex(f => f.name === key.trim()) !== -1
        })
        .forEach(key => {
          const field = this.fieldMap.find(f => f.name === key.trim());

          if (field.type === 'category' && typeof rowData[key] === 'string') {
            const separator = field.settings?.separator || ';';
            const parts = rowData[key].split(separator).map(p => slug(p.trim(), {lower: true}));


            data['categories'] = parts.map(p => {

              const found = categories[slug(p, {lower: true})];

              if (!found) {
                // console.log(`Category ${p} not found`, Object.keys(categories).length);
                isInvalid = true;
                invalidFields.push({key, value: p});
                return null;
              }

              return found['uuid'];
            });

          }

          if (field.type === 'property') {
            if (['N/A'].indexOf(rowData[key]) !== -1) {return;}
            const foundValue = flatProperties[`${key}.${slug(rowData[key], {lower: true})}`];


            if (foundValue) {
              data['properties'].push(foundValue);
            } else {
              isInvalid = true;
              invalidFields.push({ key, value: rowData[key] });
            }

          }

          if (field.type === 'variantId') {
            data['variantId'] = rowData[key];
            data['variantSlug'] = slug(rowData[key], {trim: true, lower: true});
          }

        });



      if (isInvalid) {
        res.isInvalid = true;
        res.invalidRows.push({id: rowData['sku'], row: idx, fields: invalidFields});
      }

      res.data[idx] = Object.assign(res.data[idx], data);
    }

    return res;
  }

  async process(file: Partial<Express.Multer.File>) {
    let res: IProcessedResult = await this.analyze(file);

    const defaultChannelQuery = await (new SalesChannelsService()).find({default: true});
    const salesChannel = defaultChannelQuery.data[0]['uuid'] || 'storefront';

    let products = res.data.map((product) => {
      product.salesChannel = product.salesChannel || salesChannel;

      return product;
    });



    await this.importToDb(products);

    SharedModule.eventEmitter.emit(ProductEventNames.productImportDone);

    return Promise.resolve({
      success: true,
      rowsProcessed: res.data.length
    });
  }

  private async importToDb(products: any[]) {
    try {
      await this.createProducts(products);
    } catch (error) {
      console.error('Error in createProducts:', error);
    }

    try {
      await this.linkProductsToCategories(products);
    } catch (error) {
      console.error('Error in linkProductsToCategories:', error);
    }

    try {
      await this.linkProductsToProperties(products);
    } catch (error) {
      console.error('Error in linkProductsToProperties:', error);
    }


    try {
      await this.linkProductsToSalesChannels(products);
    } catch (error) {
      console.error('Error in linkProductsToSalesChannels:', error);
    }

    try {
      await this.assignDefaultImageToProduct(products);
    }
    catch (e) {
      console.log(`Error assigning default image to product`, e);
    }

    try {
      await this.handleImages(products);
    } catch (error) {
      console.error('Error in handleImages:', error);
    }

    try {
      await this.linkProductsToTags(products);
    } catch (error) {
      console.error('Error in linkProductsToTags:', error);
    }
  }

  private async createProducts(products: any[]) {
    const fieldQuery = store
      .getState()
      .models.Product.fields // .filter(field => products[idx][field.varName])
      .map((field) => {
        return `CALL apoc.do.when(row.${field.varName} is not null, "MATCH (n) SET n.${field.varName} = row.${field.varName} return n",'', {row:row, n:n}) yield value as value${field.varName}`;
      });

    this.fieldMap.forEach((field) => {
      const found = store.getState().models.Product.fields.find((f) => f.varName === field.name);
      if (found) {
        return;
      }
      if (field.name.includes('property.')) {
        return;
      }

      fieldQuery.push(
        `CALL apoc.do.when(row.${field.name} is not null, "MATCH (n) SET n.${field.name} = row.${field.name} return n",'', {row:row, n:n}) yield value as value${field.name}`,
      );
    });

    const mainQuery = `
    UNWIND $rows as row
    MERGE (n:Product {sku: row.sku})
          ON CREATE SET  n.updatedAt = datetime(), n.createdAt = datetime()
          ON MATCH SET   n.updatedAt = datetime()
   
    WITH row, n
   ${fieldQuery.join(' \n WITH row,n \n')}       
 
          RETURN *;
      `;


    try {
      await new ProductService().neo.write(mainQuery, {
        rows: products,
      });
      console.log('Importing product to DB: All done');
      return true;
    } catch (e) {
      console.log(e);
    }
  }

  private async linkProductsToCategories(products: any[]) {
    const query = `
        UNWIND $rows as row
    MATCH (n:Product {sku: row.sku})
    with row,n
    UNWIND row.categories as category
    MATCH (c:ProductCategory {uuid:category})
    MERGE (n)-[r:HAS_CATEGORY]->(c) 
    ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
    ON MATCH SET   r.updatedAt = datetime()
    
    return *;
    `;

    try {
      await (new ProductService).neo.write(query,
        {
          rows: products
        }
      );

      console.log("Importing product categories to DB: All done");
    } catch (e) {
      console.log(`Could not import product categories to DB:`, e);
    }

  }

  private async linkProductsToProperties(products: any[]) {
    products.forEach((p) => {
      if (!Array.isArray(p['propertyValues'])) {
        p['propertyValues'] = [];
      }
      if (!Array.isArray(p['assignedProperties'])) {
        p['assignedProperties'] = [];
      }

      p.variants.forEach((v) => {
        v.properties.forEach((prop) => {
          p['propertyValues'].push({
            propertyId: prop.propertyId,
            propertyName: prop.propertySlug,
            propertyValue: prop.slug,
            sku: p.sku,
            uuid: prop.uuid
          });
          p['assignedProperties'].push({
            propertyId: prop.propertyId,
            propertyName: prop.propertySlug,
            sku: p.sku
          });
        });
      });

      p['assignedProperties'] = uniqBy(p['assignedProperties'], 'propertyId');
    });

    const propertiesQuery = `
    UNWIND $rows as row
    MATCH (n:Product {sku: row.sku})
    with row,n
    UNWIND row.assignedProperties as assignedProperty
    MATCH (property:Property {uuid:assignedProperty.propertyId})
    MERGE (n)-[rProperty:HAS_PROPERTY]->(property)
    ON CREATE SET  rProperty.updatedAt = datetime(), rProperty.createdAt = datetime()
    ON MATCH SET   rProperty.updatedAt = datetime()
 
      
      RETURN *;
    `;

    const propertyValuesQuery = `
        UNWIND $rows as row
        MATCH (n:Product {sku: row.sku})
        with row,n
        UNWIND row.propertyValues as value
        MATCH (propertyValue:PropertyValue {uuid:value.uuid})
        MERGE (n)-[rPropertyValue:HAS_PROPERTY_VALUE]->(propertyValue)
        ON CREATE SET  rPropertyValue.updatedAt = datetime(), rPropertyValue.createdAt = datetime()
        ON MATCH SET   rPropertyValue.updatedAt = datetime()
       
        RETURN *;
    `;

    try {
      await new ProductService().neo.write(propertiesQuery, {
        rows: products,
      });
    }
    catch (e) {
      console.log(`Error in linking products to properties`, e);
    }

    try {
      await new ProductService().neo.write(propertyValuesQuery, {
        rows: products,
      });
    }
    catch (e) {
      console.log(`Error in linking products to property values`, e);
    }

  }


  private async linkProductsToSalesChannels(products: any[]) {
    const query = `
        UNWIND $rows as row
    MATCH (n:Product {sku: row.sku})
    MATCH (sc:SalesChannel {uuid: row.salesChannel})
    MERGE (n)-[r:HAS_SALES_CHANNEL]->(sc)
    ON CREATE SET r.createdAt = datetime()
    ON MATCH SET r.updatedAt = datetime()
    return *;
    `;

    try {
      await (new SalesChannelsService()).neo.write(query,
        {
          rows: products,
        },
      );

      console.log('Linking products to sales channels: All done');
    } catch (e) {
      console.log(`Could not link products to sales channels:`, e);
    }
  }

  private async assignDefaultImageToProduct(products: any[]) {

    products.forEach((p) => {
      // if the 0 variant has no image go to the next until we find one or null
      // extract the download image and save to DB into a service to use it with the UI
      p['thumb'] = p.variants[0].image || null;
    });

  }

  private async handleImages(products: any[]) {
    // make it a common function cause it will be used by other importers as well
    let template = ImportTemplateRegistry.findOne({id: this.settings.imageProcessorTemplate ? this.settings.imageProcessorTemplate : 'AddImagesToProductsTemplate'});
    const provider = template.reference;
    // using the template field map, create a new array of objects that contain the image and the variantId
    const images = [];
    const primaryKeyField = provider.fieldMap.find((f) => f.isPrimaryKey === true);
    const primaryKey = primaryKeyField ? primaryKeyField.name : 'variantId';

    products.forEach((p) => {
      p.variants.forEach((v) => {
        const temp = {};
        provider.fieldMap.forEach((field) => {
          temp[field.name] = v[field.name];
        });
        images.push(temp);
      });
    });

    // pass the images to the provider to handle them
    const service = new provider();
    let res;
    try {
      res = await service.processArray(images, 'Product', primaryKey);
    }
    catch (e) {
      console.log(`Error processing images for products}`, e);
    }

    if (Array.isArray(res.missing)) {
      // push to the queue
      SharedModule.eventEmitter.emit(ImportProductPhotosService.importPhotosStartEventName, res.missing.map(item => ({...item, ...{
          model: 'ProductVariant',
          itemFilter: {[primaryKey]: item[primaryKey]},
          type: 'main'
        }})));
    }


  }

  private async linkProductsToTags(products: any[]) {
    const service = new TagService();
    for (let idx = 0; products.length > idx; idx++) {
      await service.bulkAddTagsToModel('Product', {sku: products[idx].sku}, products[idx].tags);
    }

    console.log('Products linked to tags')
  }
}
