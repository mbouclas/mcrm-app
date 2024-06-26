import { BaseImportService } from "~catalogue/import/services/base-import.service";
import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { ProductEventNames, ProductService } from "~catalogue/product/services/product.service";
import { ImageService } from "~image/image.service";
import { Injectable } from "@nestjs/common";
import { SharedModule } from "~shared/shared.module";
const crypto = require('crypto')

export interface IInputImage {
  sku: string;
  variantId: string;
  image: string;
  hash?: string;
  imageId?: string;
}

@McrmImportTemplate({
  id: 'AddImagesToVariantsTemplate',
  name: 'Add Images to Variants',
  description: 'Adds images to variants based on an input CSV file',
  type: 'images',
  metaData: {
    default: true,
  }
})
@Injectable()
export class AddImagesToVariantsTemplateService extends BaseImportService {
  @ImportTemplateField({name: 'sku', importFieldName: 'sku', required: true, type: 'text'})
  public sku: string;

  @ImportTemplateField({name: 'variantId', importFieldName: 'variantId', required: true, type: 'variantId', rename: false})
  public variantId: string;

  @ImportTemplateField({name: 'image', importFieldName: 'image', required: true, type: 'image'})
  public image: string;


  async processArray(images: IInputImage[], model: string, primaryKey: string) {
    // run a query to figure out which images are in the DB and which are not
    for (let idx = 0; idx < images.length; idx++) {
      let img;
      try {
        const json = JSON.parse(images[idx].image);
        img = json.url;
      }
      catch (e) {
        img = images[idx].image;
      }

      images[idx].hash = crypto.createHash('md5').update(img).digest("hex");
    }

    const findMissingImagesQuery = `
    UNWIND $rows as row
    MATCH (n:Image {originalLocation: row.hash}) WHERE n IS NOT NULL
    return n.uuid as image, n.url as imageUrl, row.hash as hash, row as input;
    `;

    const service = new ImageService();
    const res = await service.neo.readWithCleanUp(findMissingImagesQuery, {rows: images});

    // subtract the images that are in the DB from the input array
    const missing = images.filter(i => {
      return  res.findIndex(d => d.hash === i.hash) === -1;
    });

    res.forEach(r => {
      r.imageId = r.image;
      r.thumb = JSON.stringify({url: r.imageUrl, type: 'main', active: true, uuid: r.imageId})
      r.imageUrl = JSON.stringify({url: r.imageUrl})
    });

    const assignImagesToModelQuery = `
    UNWIND $rows as row
    MATCH (n:${model} {${primaryKey}: row.input.${primaryKey}})
    MATCH (i:Image {uuid: row.imageId})
    MERGE (n)-[r:HAS_IMAGE]->(i)
    ON CREATE SET r.createdAt = datetime(), r.type = 'main'
    ON MATCH SET r.updatedAt = datetime()
    WITH row, n
    SET n.thumb = row.thumb
    `;


    try {
      await service.neo.write(assignImagesToModelQuery, {rows: res});
    }
    catch (e) {
      console.log(`Error executing image assignment query`, e);
    }

    // Upload to cloudinary

    return {
      success: true,
      rowsProcessed: res.length,
      missing,
    }
  }

  async process(file: Partial<Express.Multer.File>) {
    // run the processor against the database
    const res = await this.processor.run(file);


    const service = new ProductService();
    const query = `
    UNWIND $rows as row
    MATCH (n:ProductVariant {variantId: row.variantId})
    SET n.thumb = row.image, n.updatedAt = datetime()
    RETURN n;
    `;

    try {
      await service.neo.write(query, {rows: res.data});
    }
    catch (e) {
      console.log(`Error executing product variant image update query`, e);
    }

    SharedModule.eventEmitter.emit(ProductEventNames.productImportDone);

    return {
      success: true,
      rowsProcessed: res.data.length,
    };
  }
}
