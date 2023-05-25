import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ImportQueueService } from '~catalogue/import/services/import-queue.service';
import { Job } from 'bullmq';
import { CsvProcessorService } from '~catalogue/import/services/csv-processor.service';
import { groupBy } from 'lodash';
import { ProductCategoryModel } from '~catalogue/product/models/product-category.model';
import { PropertyModel } from '~catalogue/property/models/property.model';
import { ProductCategoryService } from '~catalogue/product/services/product-category.service';
import { PropertyService } from '~catalogue/property/services/property.service';
import { ProductService } from '~catalogue/product/services/product.service';
import { store } from '~root/state';
import { CacheService } from '~shared/services/cache.service';
import { IImportProcessorFieldMap } from '~catalogue/import/services/base-processor';
import { PropertyValueModel } from '~catalogue/property/models/property-value.model';
import { ImageService } from '~image/image.service';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';

const slugify = require('slug');

export interface ITransformerResult<T> {
  data: T;
  isInvalid: boolean;
  invalidFields: IInvalidField[];
}

export interface IImportSchema {
  title: string;
  sku: string;
  description: string;
  price: number;
  properties: { key: string; value: any }[];
  categories: string[];
  image: string;

  [key: string]: any;
}

export interface IInvalidField {
  id: string | number;
  row: number;
  fields: {
    key: string;
    value: string;
  }[];
}

export interface IProcessorResult {
  data: IImportSchema[];
  isInvalid: boolean;
  invalidRows: IInvalidField[];
  validRows: number;
}

@Injectable()
export class ImportService implements OnApplicationBootstrap {
  protected static processors = {
    csv: {
      processor: CsvProcessorService,
    },
  };
  public static jobEventName = 'import:docs';
  public static processImageJobEventName = 'import:process:image';
  protected categories: ProductCategoryModel[] = [];
  protected properties: PropertyModel[] = [];
  protected propertyValues: PropertyValueModel[] = [];
  protected static readonly importResultCacheKey = 'import-job-';
  private static defaultFieldMap: IImportProcessorFieldMap[] = [
    {
      importFieldName: 'Reference',
      name: 'sku',
      required: true,
    },
    {
      importFieldName: 'variantID',
      name: 'variantId',
      required: true,
      type: 'variantId',
    },
    {
      importFieldName: 'Name',
      name: 'title',
      required: true,
      isSlugFor: 'slug',
    },
    {
      importFieldName: 'Eng Description',
      name: 'description',
      required: true,
    },
    {
      importFieldName: 'PRICE',
      name: 'price',
      required: true,
      type: 'float',
    },
    {
      importFieldName: 'Image',
      name: 'image',
      required: true,
      type: 'text',
    },
    {
      importFieldName: 'PIECES PER BOX',
      name: 'pieces',
      required: false,
      type: 'number',
    },
    {
      importFieldName: 'Item Height',
      name: 'height',
      required: false,
      type: 'number',
    },
    {
      importFieldName: 'Item Width',
      name: 'width',
      required: false,
      type: 'number',
    },
    {
      importFieldName: 'Item Weight',
      name: 'weight',
      required: false,
      type: 'number',
    },
    {
      importFieldName: 'Item Diameter',
      name: 'diameter',
      required: false,
      type: 'number',
    },
    {
      importFieldName: 'Category',
      name: 'categories',
      required: true,
      type: 'category',
    },
    {
      importFieldName: 'SIZE',
      name: 'property.size',
      required: false,
      type: 'property',
    },
    {
      importFieldName: 'property.color',
      name: 'color',
      required: false,
      matchSourceValue: 'code',
      matchTargetValue: 'name',
      type: 'property',
    },
    {
      importFieldName: 'property.material',
      name: 'material',
      required: false,
      matchSourceValue: 'slug',
      matchTargetValue: 'slug',
      type: 'property',
      slugifyValue: true,
    },
  ];

  static setFieldMap(fields: IImportProcessorFieldMap[]) {
    this.defaultFieldMap = fields;
    return this;
  }

  setFieldMap(fields: IImportProcessorFieldMap[]) {
    ImportService.defaultFieldMap = fields;
    return this;
  }

  async onApplicationBootstrap() {
    ImportQueueService.addWorker(this.processIncomingUpload, ImportQueueService.queueName);
    ImportQueueService.addWorker(this.processImageFromImport, ImportQueueService.imageProcessingQueueName);
    ImportQueueService.imageProcessingEvents.on('completed', async (res) => {
      // res.returnvalue is and instance of IImportSchema
      console.log(`Image processing for job ${res.jobId} is complete`);
    });

    ImportQueueService.imageProcessingEvents.on('failed', (res) => {
      console.log(`Image Processing ${res.jobId} Failed`, res);
    });

    ImportQueueService.imageProcessingEvents.on('drained', (res) => {
      console.log(`No more Image Processing jobs remaining`);
    });

    const dummyFile = {
      fieldname: 'file',
      originalname: 'CLOTHING masterfile 2022.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      destination: 'I:\\Work\\mcms-node\\upload',
      filename: 'Product Import.csv',
      path: 'I:\\Work\\mcms-node\\mcrm\\upload\\Product Import.csv',
      size: 17760597,
    };

    // setTimeout(async () => await ImportQueueService.queue.add(ImportService.jobEventName, dummyFile), 1000);
  }

  /**
   * Example of how to add something for this worker to pick it up
   * await ImportQueueService.queue.add(ImportService.jobEventName, file)
   * @param job
   */
  async processIncomingUpload(job: Job) {
    console.log(`processing Import job ${job.id}`);
    const res = await new ImportService().processFile(job.data);
    // add to cache
    await new CacheService().put(`${ImportService.importResultCacheKey}${job.id}`, res, 600);
  }

  /**
   * job.data is an instance of IImportSchema
   * @param job
   */
  async processImageFromImport(job: Job) {
    const product = job.data as IImportSchema;
    if (process.env.ENV !== 'production' && !job.data.processForReal) {
      console.log(`processing Image from Import job ${job.id}`);
      return {};
    }

    if (!product.image) {
      console.info(`No image found on product ${product.sku} and job ${job.id}`);
      return;
    }

    const service = new ImageService();
    let res;

    try {
      res = await service.handle(product.image, 'remote');
    } catch (e) {
      console.log('Handler error ', e);
    }

    const p = await new ProductService().findOne({ sku: product.sku });

    await service.linkToObject({ uuid: res.id }, 'Product', p['uuid']);

    if (Array.isArray(product.variants)) {
      for (let idx = 0; product.variants.length > idx; idx++) {
        if (!product.variants[idx].image) {
          continue;
        }

        const variant = await new ProductVariantService().findOne({ variantId: product.variants[idx].variantId });

        if (!variant) {
          continue;
        }
        const img = await service.handle(product.variants[idx].image, 'remote');

        await service.linkToObject({ uuid: img.id }, 'ProductVariant', variant['uuid']);
        console.log(`Variant ${variant['variantId']} linked to image ${img.id}`);
      }
    }

    console.log(`processing Image from Import job ${job.id}`);
    return res;
  }

  async pullAllCategories() {
    const s = new ProductCategoryService();
    const res = await s.find({ limit: 200 });
    this.categories = res.data as ProductCategoryModel[];
  }

  async pullAllProperties() {
    const s = new PropertyService();
    const res = await s.find({ limit: 200 });

    this.properties = res.data as PropertyModel[];
  }

  async pullAllPropertyValues() {
    const s = new PropertyService();
    const res = await s.getAllPropertyValues();

    this.propertyValues = res as PropertyValueModel[];
  }

  async analyzeFile(file: Express.Multer.File, limit?: number) {
    let res: IProcessorResult;
    try {
      const processor = ImportService.determineProcessorBasedOnMimeType(file.mimetype);
      const processorService = new processor.processor();

      processorService.setFieldMap(ImportService.defaultFieldMap);

      res = await processorService.run(file);
    } catch (e) {
      console.log(`Error processing file ${file.originalname}`, e);
    }
    const grouped = groupBy(res.data, 'sku');
    res.validRows = Object.keys(grouped).length;
    if (limit) {
      res.data = res.data.slice(0, limit);
    }

    return res;
  }

  async processFile(file: Express.Multer.File) {
    const s = new ImportService();

    const res = await s.analyzeFile(file);

    // Now try to group products into variants, images etc

    // Filter out invalid rows
    res.data = res.data
      .filter((row, idx) => res.invalidRows.findIndex((r) => r.id === row.sku) === -1)
      .map((row) => row);

    // Figure out the variants

    const productsRaw = groupBy(res.data, 'sku');
    // console.log(products['1011'][0])

    // Pull all categories and properties
    try {
      await s.pullAllCategories();
      await s.pullAllProperties();
      await s.pullAllPropertyValues();
    } catch (e) {
      console.log(e);
    }

    let idx = 0;
    const products = Object.keys(productsRaw).map((key) => {
      // At this point, row is an array of products, variants
      const row = productsRaw[key];
      // Avoid Circular assignments
      const product = Object.assign({}, row[0]);

      // Assign categories to each entry

      // remove properties as product with more than 1 variants can't have properties
      if (row.length === 0) {
        idx++;

        return product;
      }

      // Assign properties to each entry. Slugify to match the DB
      product.categories = product.categories.map((c) => {
        return slugify(c, { lower: true });
      });

      product.assignedProperties = product.properties.map((prop) => prop.key.trim().toLowerCase());

      delete product.properties;
      // Avoid Circular assignments
      product.variants = [];
      product.allProperties = [];
      row.forEach((r, index) => {
        const name = [r.sku];
        const variantId = product.variantId ? product.variantId : `${r.sku}.${index}`;

        // console.log(r)
        product.allProperties.push(
          Object.assign(
            [],
            r.properties.map((prop) => ({
              key: prop.key.trim().toLowerCase(),
              value: prop.value,
            })),
          ),
        );

        const properties = [];

        r.properties.forEach((p) => {
          let iterationName = p.value;
          //If the prop has a different name to the default
          const foundField = ImportService.defaultFieldMap.find((f) => f.name === p.key);

          // assign the name based on a custom property value
          //For example, we need the color to look like Black, but we have the color code as key
          //So we make the switch and the variant name will get correct value
          if (foundField) {
            const foundValue = s.propertyValues.find((l) => l[foundField.matchSourceValue] === p.value);
            iterationName = foundValue && foundValue[foundField.matchTargetValue];
          }

          name.push(p.key);
          const temp = {};

          temp[p.key.toLowerCase().trim()] = p.value;
          properties.push(temp);
        });

        delete r.categories;
        delete r.properties;
        product.variants.push(
          Object.assign(
            {
              ...{
                name: name.join(' - '),
                variantId,
                price: r.price || 0,
                image: r.image || null,
                properties,
              },
            },
            r,
          ),
        );
      });

      /*      if (product.sku === 'R7200') {
              console.log(product.variants[1]);
            }*/

      product.propertyValues = [];
      product.allProperties.forEach((prop) => {
        // each prop is a key-value[]
        prop.forEach((p) => product.propertyValues.push(p));
      });

      idx++;

      return product;
    });

    // Default image, category, tags etc for the product is the ones of product variant 1
    //   console.log(JSON.stringify(products[0]))
    // Deactivate all products where fromImport = true
    await this.deactivateProducts();
    await this.importToDb(products);
    // Merge all products

    // Add relationships

    // Find out which images need processing
    // Queue images for processing

    return { success: true, processed: products.length };
  }

  static determineProcessorBasedOnMimeType(mimeType: string) {
    switch (mimeType) {
      case 'text/csv':
        return this.processors.csv;
        break;
    }
  }

  private async deactivateProducts() {
    const query = `MATCH (n:Product) WHERE n.fromImport IS NOT NULL SET n.active = false return *;`;
    await new ProductService().neo.write(query);

    return this;
  }

  protected async importToDb(products: IImportSchema[]) {
    const s = new ProductService();
    const is = new ImportService();

    // console.log(JSON.stringify(products.find(p => p.sku === "R7200")))
    // return
    await is.pullAllProperties();

    for (let idx = 0; products.length > idx; idx++) {
      products[idx].active = true;
      products[idx].fromImport = true;
      products[idx].quantity = products[idx].quantity || 0;

      if (idx === 0) {
      }
    }

    const fieldQuery = store
      .getState()
      .models.Product.fields // .filter(field => products[idx][field.varName])
      .map((field) => {
        return `CALL apoc.do.when(row.${field.varName} is not null, "SET n.${field.varName} = row.${field.varName}",'', {row:row, n:n}) yield value as value${field.varName}`;
      });

    ImportService.defaultFieldMap.forEach((field) => {
      const found = store.getState().models.Product.fields.find((f) => f.varName === field.name);
      if (found) {
        return;
      }
      if (field.name.includes('property.')) {
        return;
      }

      fieldQuery.push(
        `CALL apoc.do.when(row.${field.name} is not null, "SET n.${field.name} = row.${field.name}",'', {row:row, n:n}) yield value as value${field.name}`,
      );
    });

    // Using CALL apoc.do.when to eliminate empty field values. If the import runs on existing products, it will delete the values
    const mainQuery = `
    UNWIND $rows as row
    MERGE (n:Product {sku: row.sku})
          ON CREATE SET  n.updatedAt = datetime(), n.createdAt = datetime()
          ON MATCH SET   n.updatedAt = datetime()
   
    WITH row, n
   ${fieldQuery.join(' \n WITH row,n \n')}       

          WITH n,row
          // now do the categories
          UNWIND row.categories as category
          MATCH (c:ProductCategory {slug:category})
          MERGE (n)-[r:HAS_CATEGORY]->(c) 
          ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
          ON MATCH SET   r.updatedAt = datetime()
         /* 
          WITH row, n
          // properties
          UNWIND row.assignedProperties as propertySlug
          MATCH (property:Property {slug:propertySlug})
          MERGE (n)-[rProperty:HAS_PROPERTY]->(property)
          ON CREATE SET  rProperty.updatedAt = datetime(), rProperty.createdAt = datetime()
          ON MATCH SET   rProperty.updatedAt = datetime()
          */
          
          // Property Values.
          /*
          WITH row, n
          UNWIND row.propertyValues as propertyValue
          MATCH (propValue:PropertyValue {name:propertyValue.value})<-[:HAS_VALUE]-(property:Property {slug: propertyValue.key})
          MERGE (n)-[rPropertyValue:HAS_PROPERTY_VALUE]->(propValue)
          ON CREATE SET  rPropertyValue.updatedAt = datetime(), rPropertyValue.createdAt = datetime()
          ON MATCH SET   rPropertyValue.updatedAt = datetime()
          */
          
        /*
          WITH row, n
          // variants
          UNWIND row.variants as variant
          MERGE (pv:ProductVariant {variantId: variant.variantId})
          ON CREATE SET pv.variantId = variant.variantId, pv.sku = variant.sku, pv.name = variant.name, 
          pv.price = variant.price, pv.image = variant.image,  pv.updatedAt = datetime(), pv.createdAt = datetime()
          ON MATCH SET   pv.updatedAt = datetime()
          WITH *
          MERGE (n)-[rpv:HAS_VARIANTS]->(pv)
          ON CREATE SET  rpv.updatedAt = datetime(), rpv.createdAt = datetime()
          ON MATCH SET   rpv.updatedAt = datetime()
       */
          

           WITH row, n
          // images
                    
          RETURN *;
      `;
    // console.log(mainQuery)
    // console.log('---------', products.length)
    // console.log(query);
    // console.log(products[1].variants)
    // console.log(products[0]['propertyValues']);
    // console.log(JSON.stringify(products[0]))
    try {
      const res = await s.neo.write(mainQuery, {
        // rows: [products[0]]
        rows: products,
      });
      console.log('Importing product to DB: All done');
      // console.log(res)
    } catch (e) {
      console.log(e);
    }

    // Variants

    try {
      await s.neo.write(`MATCH (v:ProductVariant) detach delete v`);
      console.log('All variants cleared');
    } catch (e) {
      console.log('Could not delete variants');
    }

    try {
      const variantQuery = `
      UNWIND $rows as row
      MATCH (n:Product {sku: row.sku})
      with row,n
      
      UNWIND row.variants as variant
      MERGE (pv:ProductVariant {variantId: variant.variantId})
      ON CREATE

      SET pv.variantId = variant.variantId, pv.sku = variant.sku, pv.name = variant.name, 
      pv.price = variant.price, pv.image = variant.image,  pv.updatedAt = datetime(), pv.createdAt = datetime()

      WITH *
      MERGE (n)-[rpv:HAS_VARIANTS {createdAt: datetime()}]->(pv)
    
          
      RETURN *;
      `;

      await s.neo.write(variantQuery, {
        rows: products,
      });
      console.log('Importing variants to DB: All done');
    } catch (e) {
      console.log('Error in Variants', e);
    }

    await this.importProperties(products);
    await this.importPropertyValues(products);

    try {
      // need to reshape the data to update all the variants in one go as well as attach the properties
      let variants = [];
      products.forEach((p) => {
        variants = variants.concat(
          p.variants.map((pv) => {
            const variant: any = {
              variantId: pv.variantId,
              sku: pv.sku,
              propertyKeys: [],
              properties: pv.properties,
            };
            // attach a property like color: red to the variant
            pv.properties.forEach((prop) => {
              const key = Object.keys(prop)[0];
              variant[key] = prop[key];
              variant.propertyKeys.push(key);
            });

            return variant;
          }),
        );
      });

      const propertiesVariantQuery = is.properties.map((prop) => {
        return `pv.${prop['slug']} = row.${prop['slug']}`;
      });

      const variantsPropertyValuesQuery = is.properties.map((prop, idx) => {
        const found = ImportService.defaultFieldMap.find((f) => f.name === prop['slug'] && f.type === 'property');
        if (!found) {
          return;
        }

        return `
        MATCH (property${idx}:Property {slug: '${found.name}'})-[r${idx}:HAS_VALUE]->(propertyValue${idx}:PropertyValue {${found.matchSourceValue}: row.${found.name}})
        MERGE (pv)-[rp${idx}:HAS_PROPERTY_VALUE]->(propertyValue${idx})
        ON CREATE SET rp${idx}.createdAt = datetime(), rp${idx}.updatedAt = datetime()
        ON MATCH SET rp${idx}.updatedAt = datetime()
        `;
      });

      await s.neo.write(
        `
      UNWIND $rows as row
      with row
      MATCH (pv:ProductVariant {variantId: row.variantId})
      SET ${propertiesVariantQuery}
      WITH *
       ${variantsPropertyValuesQuery.join(`WITH *\n`)}
       return *;
      `,
        {
          rows: variants,
        },
      );

      console.log('Updating variants to DB: All done');
    } catch (e) {
      console.log(`Error in Variants`, e);
    }

    // console.log('*********', JSON.stringify(products.find(p => p.sku === 'R7200')), '*********')

    // await this.importImages(products);
  }

  async importProperties(products: IImportSchema[]) {
    const s = new ProductService();
    const query = `
          UNWIND $rows as row
          MATCH (n:Product {sku: row.sku})
          with row,n
          UNWIND row.assignedProperties as propertySlug
          MATCH (property:Property {slug:propertySlug})
          MERGE (n)-[rProperty:HAS_PROPERTY]->(property)
          ON CREATE SET  rProperty.updatedAt = datetime(), rProperty.createdAt = datetime()
          ON MATCH SET   rProperty.updatedAt = datetime()
 
      
      RETURN *;
    `;

    try {
      await s.neo.write(query, { rows: products });
      console.log('importing properties to DB: All done');
    } catch (e) {
      console.log('Error importing properties', e);
    }
  }

  /**
   * for each property, create a query based on the matching fields
   * @param products
   */
  async importPropertyValues(products: IImportSchema[]) {
    const s = new ProductService();
    const is = new ImportService();
    // await is.pullAllProperties();
    const propertyMapQueryArr = ImportService.defaultFieldMap
      .filter((f) => f.type === 'property')
      .map((f, index) => {
        const matchingField = f.matchSourceValue ? f.matchSourceValue : 'slug';
        return `
              UNWIND $rows as row
          MATCH (n:Product {sku: row.sku})
          with row,n
          UNWIND row.propertyValues as propertyValue
        MATCH (propValue${index}:PropertyValue {${matchingField}:propertyValue.value})<-[:HAS_VALUE]-(property:Property {slug: propertyValue.key})
        MERGE (n)-[rPropertyValue${index}:HAS_PROPERTY_VALUE]->(propValue${index})
        ON CREATE SET  rPropertyValue${index}.updatedAt = datetime(), rPropertyValue${index}.createdAt = datetime()
        ON MATCH SET   rPropertyValue${index}.updatedAt = datetime()
        return *;
        `;
      });

    // console.log(propertyMapQueryArr[0])

    for (let idx = 0; propertyMapQueryArr.length > idx; idx++) {
      try {
        await s.neo.write(propertyMapQueryArr[idx], { rows: products });
        console.log(`Updating property values ${idx} done`);
      } catch (e) {
        console.log('Error updating property values', e);
      }
    }
  }

  /**
   * This is a tricky one as images need to be processed async.
   * Each image must go into a queue where a worker will process it and
   * once done and we have a url, update the DB.
   * Using processImageFromImport as the job handler
   * @param products
   */
  async importImages(products: IImportSchema[]) {
    for (let idx = 0; products.length > idx; idx++) {
      const job = await ImportQueueService.imageProcessingQueue.add(
        ImportService.processImageJobEventName,
        products[idx],
      );
    }
  }

  async getImportResult(jobId: number) {
    const job = await ImportQueueService.queue.getJob(jobId.toString());

    return { state: await job.getState() };
    // const res = await (new CacheService()).get(`${ImportService.importResultCacheKey}${jobId}`);

    // return !res ? null : res;
  }
}
