import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import { Job } from "bullmq";
import { CsvProcessorService } from "~catalogue/import/services/csv-processor.service";
import { groupBy } from "lodash";
import { ProductCategoryModel } from "~catalogue/product/models/product-category.model";
import { PropertyModel } from "~catalogue/property/property.model";
import { ProductCategoryService } from "~catalogue/product/services/product-category.service";
import { PropertyService } from "~catalogue/property/property.service";
import { ProductModelDto, ProductService } from "~catalogue/product/services/product.service";
import { store } from "~root/state";

export interface ITransformerResult {
  data: IImportSchema;
  isInvalid: boolean;
  invalidFields: IInvalidField[];
}

export interface IImportSchema {
  title: string;
  sku: string;
  description: string;
  price: number;
  properties: {key: string, value: any}[];
  categories: string[];
  image: string;
  [key: string]: any;
}

export interface IInvalidField {
  id: string|number;
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
}

@Injectable()
export class ImportService implements OnApplicationBootstrap {
  protected static processors = {
    csv: {
      processor: CsvProcessorService
    }
  };
  public static jobEventName = 'import:docs';
  protected categories: ProductCategoryModel[] = [];
  protected properties: PropertyModel[] = [];

  async onApplicationBootstrap() {
    ImportQueueService.addWorker(this.processIncomingUpload);
    const dummyFile = {
      "fieldname": "file",
      "originalname": "CLOTHING masterfile 2022.csv",
      "encoding": "7bit",
      "mimetype": "text/csv",
      "destination": "I:\\Work\\mcms-node\\upload",
      "filename": "d37d0d502c9c2d6a12bddd16e8502efb.csv",
      "path": "I:\\Work\\mcms-node\\upload\\d37d0d502c9c2d6a12bddd16e8502efb.csv",
      "size": 17760597
    }
    // setTimeout(async () => await ImportQueueService.queue.add(ImportService.jobEventName, dummyFile), 1000)

  }

  /**
   * Example of how to add something for this worker to pick it up
   * await ImportQueueService.queue.add(ImportService.jobEventName, file)
   * @param job
   */
  async processIncomingUpload(job: Job) {
    console.log(`processing ${job.id}`);
    await (new ImportService()).processFile(job.data);

  }


  async pullAllCategories() {
    const s = new ProductCategoryService();
    const res = await s.find({limit: 200});
    this.categories = res.data as ProductCategoryModel[];
  }

  async pullAllProperties() {
    const s = new PropertyService();
    const res = await s.find({limit: 200});

    this.properties = res.data as PropertyModel[];
  }

  async analyzeFile(file: Express.Multer.File) {
    let res: IProcessorResult;
    try {
      const processor = ImportService.determineProcessorBasedOnMimeType(file.mimetype);
      const processorService = new processor.processor;
      processorService.setFieldMap([
        {
          importFieldName: 'Reference',
          name: 'sku',
          required: true,
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
          importFieldName: 'Category',
          name: 'categories',
          required: true,
          type: 'category',
        },
        {
          importFieldName: 'SIZE',
          name: 'property.size',
          required: false,
          type: 'property'
        },
        {
          importFieldName: 'ColoR',
          name: 'property.color',
          required: false,
          type: 'property',
        },
        {
          importFieldName: 'material',
          name: 'property.material',
          required: false,
          type: 'property',
        },
      ]);

      res = await processorService.run(file);
    }
    catch (e) {
      console.log(e)
    }


    return res;
  }

  async processFile(file: Express.Multer.File) {
    const s = new ImportService();
    const res = await s.analyzeFile(file);

    // Now try to group products into variants, images etc

    // Filter out invalid rows
    res.data = res.data
      .filter((row, idx) => res.invalidRows.findIndex(r => r.id === row.sku) === -1)
      .map(row => row);

    // Figure out the variants

    const productsRaw = groupBy(res.data, 'sku');
    // console.log(products['1011'][0])

    // Pull all categories and properties
    try {
      await s.pullAllCategories();
      await s.pullAllProperties();
    }
    catch (e) {
      console.log(e)
    }

    let idx = 0;
    const products = Object.keys(productsRaw).map(key => {
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


      if (idx === 0) {
        // console.log(key, '-----------')
        // row.forEach(r => console.log(r.properties.map(p => `${p.value}`).join(' - ')))
      }

      // Assign properties to each entry
      product.categories = product.categories.map(c => {
        return c.toLowerCase();
      })

      product.assignedProperties = product.properties.map(prop => prop.key.trim().toLowerCase());


      delete product.properties;
      // Avoid Circular assignments
      product.variants = [];
      product.allProperties = [];
      row.forEach((r, index) => {
        const name = [];
        const variantId = `${r.sku}.${index}`;

        // console.log(r)
        product.allProperties.push(Object.assign([], r.properties.map(prop => ({
          key: prop.key.trim().toLowerCase(),
          value: prop.value
        }))));

        const properties = {};
        r.properties.forEach(p => {
          name.push(`${p.value}`);
          properties[p.key.toLowerCase().trim()] = p.value;
        });



        delete r.categories;
        delete r.properties;
        product.variants.push(Object.assign({...{name: name.join(' - '), variantId, price: r.price || 0, image: r.image || null, properties}}, r));
      });


      product.propertyValues = [];
      product.allProperties.forEach(prop => {
        // each prop is a key-value[]
        prop.forEach(p => product.propertyValues.push(p))
      })

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
  }

  static determineProcessorBasedOnMimeType(mimeType: string) {

    switch (mimeType) {
      case 'text/csv': return this.processors.csv;
      break;
    }
  }

  private async deactivateProducts() {
    const query = `MATCH (n:Product) WHERE n.fromImport IS NOT NULL SET n.active = false return *;`;
    await (new ProductService()).neo.write(query);

    return this;
  }

  protected async importToDb(products: IImportSchema[]) {
    const s = new ProductService();
    const is = new ImportService();

    await is.pullAllProperties();

    const propertiesVariantQuery = is.properties.map(prop => {
      return `pv.${prop['slug']} = variantProperty.${prop['slug']}`
    });

    for (let idx = 0; products.length > idx; idx++) {
      products[idx].active = true;
      products[idx].fromImport = true;
      products[idx].quantity = products[idx].quantity || 0;


      if (idx === 0) {

      }
    }

    const fieldQuery = store.getState().models.Product.fields
      // .filter(field => products[idx][field.varName])
      .map(field => {
        return `n.${field.varName} = row.${field.varName}`
      }).join(', ');



    const query = `
    UNWIND $rows as row
    MERGE (n:Product {sku: row.sku})
          ON CREATE SET ${fieldQuery}, n.updatedAt = datetime(), n.createdAt = datetime()
          ON MATCH SET ${fieldQuery},  n.updatedAt = datetime()
          
          WITH row, n
          
          // now do the categories
          UNWIND row.categories as category
          MATCH (c:ProductCategory {slug:category})
          MERGE (n)-[r:PRODUCT_HAS_CATEGORY]->(c) 
          ON CREATE SET  r.updatedAt = datetime(), r.createdAt = datetime()
          ON MATCH SET   r.updatedAt = datetime()
          
          WITH row, n
          // properties
          UNWIND row.assignedProperties as propertySlug
          MATCH (property:Property {slug:propertySlug})
          MERGE (n)-[rProperty:HAS_PROPERTY]->(property)
          ON CREATE SET  rProperty.updatedAt = datetime(), rProperty.createdAt = datetime()
          ON MATCH SET   rProperty.updatedAt = datetime()
          
          // Property Values
          WITH row, n
          UNWIND row.propertyValues as propertyValue
          MATCH (propValue:PropertyValue {name:propertyValue.value})<-[:HAS_VALUE]-(property:Property {slug: propertyValue.key})
          MERGE (n)-[rPropertyValue:HAS_PROPERTY_VALUE]->(propValue)
          ON CREATE SET  rPropertyValue.updatedAt = datetime(), rPropertyValue.createdAt = datetime()
          ON MATCH SET   rPropertyValue.updatedAt = datetime()
          
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
          
          WITH row, n,variant
          UNWIND variant.properties as variantProperty
          MATCH (pv) SET ${propertiesVariantQuery}
          
           WITH row, n
          // images
                    
          RETURN *;
      `;

    // console.log(query);

    // console.log(products[0]['propertyValues']);
    try {
      const res = await s.neo.write(query, {
        // rows: [products[0]]
        rows: products
      });
      console.log('All done')
// console.log(res)
    }
    catch (e) {
      console.log(e)
    }
  }
}
