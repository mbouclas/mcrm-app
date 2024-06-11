import { Injectable, OnModuleInit } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IItemImage } from "~image/models/image.types";
import { IImageProcessingProvider } from "~image/models/providers.types";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IFileUploadHandlerResult } from "~root/upload/uploader.service";
import { ICloudinaryProviderConfig } from "~image/providers/cloudinary.provider";
import { basename, join, resolve } from "path";
import { SharedModule } from "~shared/shared.module";
import { ImageModel } from "~image/models/image.model";
import { RecordUpdateFailedException } from "~shared/exceptions/record-update-failed-exception";
import { createWriteStream } from "fs";
import { HttpService } from "@nestjs/axios";
import * as stream from "stream";
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
const crypto = require("crypto");

export enum ImageEventNames {
  IMAGE_DELETED = "image.deleted",
  IMAGE_CREATED = "image.created",
  IMAGE_UPDATED = "image.updated",
  IMAGE_DELETED_FROM_CLOUDINARY = "image.deleted_from_cloudinary",
  IMAGE_DELETED_FROM_LOCAL = "image.deleted_from_local",
  IMAGE_DELETED_FROM_REMOTE = "image.deleted_from_remote",
}

export interface IDownloadFromImageFromUrlResponse {
  filename: string;
  url: string,
  hash: string;
  imageId?: string; //in case it's saved on the DB
}


@Injectable()
export class ImageService extends BaseNeoService implements OnModuleInit {
  static config;
  static provider: IImageProcessingProvider;

  constructor() {
    super();
    this.model = store.getState().models.Image;


  }

  async onModuleInit() {

  }

  @OnEvent("app.loaded")
  async onAppLoaded() {
    ImageService.config = store.getState().configs["images"];
    const provider = McmsDiContainer.get({ id: ImageService.config.provider });
    ImageService.provider = new provider.reference;
    ImageService.provider.setConfig(ImageService.config.cloudinary);

/*    setTimeout(async () => {
      const dummyFile = {
        fieldname: 'file',
        originalname: 'website masterfile 2024 makito (2).csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        destination: 'I:\\Work\\mcms-node\\upload',
        filename: 'website masterfile 2024 makito (2).csv',
        path: 'I:\\Work\\mcms-node\\mcrm\\upload\\small-import.csv',
        size: 17760597,
      };
      const s = new ImageService();
      const found = await s.findByOriginalUrl('https://makito.es/WebRoot/Store/Shops/Makito/634A/944E/AEF3/312C/1A48/0A6E/0397/C0EC/1011-006-P.jpg')
      console.log(found)
    }, 1000)*/
  }

  async findByOriginalUrl(url: string) {
    try {
      const newHash = crypto.createHash("md5").update(url).digest("hex");

      return this.findOne({ originalLocation: newHash }) as Promise<ImageModel>;
    }
    catch (e) {
      return null;
    }
  }

  async delete(uuid: string, userId?: string) {
    const image = await this.findOne({ uuid }) as ImageModel;
    await super.delete(uuid);
    SharedModule.eventEmitter.emit(ImageEventNames.IMAGE_DELETED, image);
    ImageService.provider.deleteResource(image);

    return { success: true };
  }

  // Full path or url
  async handle(file: string, type: "local" | "remote" = "local", metaData: any = {}): Promise<IFileUploadHandlerResult> {
    let url, id, res;
    const cloudinaryMetaData = {
      tags: ["from-upload"],
      metaData: `original_file=${encodeURI(basename(file))}`
    };
    if (process.env.ENV !== "production") {
      cloudinaryMetaData.tags.push("dev");
    }


    if (type === "local") {
      // url = await ImageService.provider.handleLocal(file);
      url = (process.env.ENV === "production") ? await ImageService.provider.handleLocal(file, undefined, [])
        : await ImageService.provider.handleLocal(file, undefined, [], {
          folder: "dev",
          cloudinaryMetaData
        } as unknown as ICloudinaryProviderConfig);
    } else {
      url = await ImageService.provider.handleRemote(file);
    }

    // save it to the db
    const newHash = crypto.createHash("md5").update(file).digest("hex");
    try {
      res = await this.store({
        ...{
          active: true,
          url,
          originalLocation: newHash
        }, ...metaData
      });

      id = res["uuid"];
    } catch (e) {
      console.log(e);
    }

    return {
      url,
      id
    };
  }


  async linkToObject(image: IItemImage, model: string, itemId: string, type = "main", metaData: any = {}) {
    // There can be only one. Replace old main with new one. Old one remains linked but not as main
    const metaDataQuery = function(varName: string) {
      return Object.keys(metaData).map(key => `${varName}.${key} = '${metaData[key]}'`).join(",");
    };

    let typeQuery = "";
    //Reset old main image as a regular image
    if (type === "main") {
      typeQuery = `
      WITH *
      OPTIONAL MATCH (model)-[r1:HAS_IMAGE]->(img:Image)
      WHERE r1.type = 'main'
      SET r1.type = 'image' ${metaDataQuery("r1").length ? `, ${metaDataQuery("r1")}` : ""}
      WITH image,model
      `;
    }

    const query = `MATCH (model:${model} {uuid:$itemId})
        MATCH (image:Image {uuid: $uuid})
        ${typeQuery}
        MERGE (model)-[r:HAS_IMAGE]->(image)
        ON MATCH SET r.type = $type, r.updatedAt = datetime() ${metaDataQuery("r").length ? `, ${metaDataQuery("r")}` : ""}
        ON CREATE SET r.type = $type, r.createdAt = datetime() ${metaDataQuery("r").length ? `, ${metaDataQuery("r")}` : ""}
        return *`;

    try {
      const res = this.neo.writeWithCleanUp(query, {
        itemId,
        uuid: image.uuid,
        type
      });

      return res;
    } catch (e) {
      console.log(e);
    }
  }

  async storeAndLinkToObject(name: string, model: string, type = "main", itemId?: string, imageType?: string) {

  }

  async getItemImages(model: string, uuid: string, type?: string): Promise<IItemImage[]> {
    const typeQuery = (type) ? `WHERE r.type = '${type}'` : "";

    const query = `MATCH (model:${model} {uuid: $uuid})-[r:HAS_IMAGE]->(image) ${typeQuery}
         WITH * 
         RETURN image, r
         ORDER BY r.order ASC`;
    // console.log(query)

    const res = await this.neo.readWithCleanUp(query, { uuid });

    return res.map(record => ({
      ...record.image,
      ...{
        type: record.r["type"] || null,
        order: record.r.order || null,
        title: record.r.title || null,
        description: record.r.description || null,
        alt: record.r.alt || null,
        caption: record.r.caption || null,
      }
    }));
  }

  async unlinkFromObject(uuid: string, model: string, type: string) {

  }

  groupImagesByType(images: IItemImage[]): { [key: string]: IItemImage[] } {
    return {};
  }

  private formatItem(item: any) {

  }

  async updateImageOrder(model: string, uuid: string, order: number) {

  }


  async updateImagesOrder(model: string, modelUuid: string, images: IItemImage[]) {
    const query = `
      UNWIND $images as image
      MATCH (model:${model} {uuid: $uuid})-[r:HAS_IMAGE]->(img:Image {uuid: image.uuid})
      SET r.order = image.order, r.updatedAt = datetime()
      
      return *;
    `;

    try {
      return await this.neo.writeWithCleanUp(query, {
        uuid: modelUuid,
        images
      });
    } catch (e) {
      console.log(e);
      throw new RecordUpdateFailedException(e.message);
    }
  }

  async setImageAsDefault(imageUuid: string, model: string, modelUuid: string) {
    const query = `
    MATCH (model:${model} {uuid:$uuid})
    OPTIONAL MATCH (model)-[r1:HAS_IMAGE]->(img:Image)
    SET r1.type = 'image'
    
    WITH model
    
    MATCH (image:Image {uuid: $imageUuid})
    MERGE (model)-[r:HAS_IMAGE]->(image)
    ON MATCH SET r.type = 'main', r.updatedAt = datetime()
    ON CREATE SET r.type = 'main', r.createdAt = datetime()
    
    return *;
    `

    try {
      return await this.neo.writeWithCleanUp(query, {
        uuid: modelUuid,
        imageUuid
      });
    }
    catch (e) {
      console.log(e);
      throw new RecordUpdateFailedException(e.message);
    }

  }

  /**
   * This is different to update as we are updating details on the relationship between the image and the model
   * @param imageUuid
   * @param model
   * @param modelUuid
   * @param details
   */
  async updateImageDetails(imageUuid: string, model: string, modelUuid: string, details: any) {
    let updateQuery = [];
    for (let key in details) {
      updateQuery.push(`r.${key} = '${details[key]}'`);
    }

    const query = `
    MATCH (model:${model} {uuid:$uuid})-[r:HAS_IMAGE]->(image:Image {uuid: $imageUuid})
   
    SET ${updateQuery.join(',')}, r.updatedAt = datetime()
    return *;
    `;

    try {
      return await this.neo.writeWithCleanUp(query, {
        uuid: modelUuid,
        imageUuid
      });
    }
    catch (e) {
      console.log(e);
      throw new RecordUpdateFailedException(e.message);
    }
  }

  /**
   *
   * @param url
   * @param filename
   * @param makeItPermanent //Saves it on cloudinary and the DB. If false returns the original url
   */
  async downloadImageFromUrl(url: string, filename: string = null, makeItPermanent = false): Promise<IDownloadFromImageFromUrlResponse> {
    try {
      const found = await this.findByOriginalUrl(url);
      return { filename, url: found.url, hash: found.originalLocation, imageId: found.uuid };
    } catch (e) {

    }

    filename = filename || resolve(join( './', 'upload', basename(url)));
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`unexpected response ${response.statusText}`);
    }

    await pipeline(response.body, createWriteStream(filename));

    const hash = crypto.createHash('md5').update(url).digest("hex");

    if (!makeItPermanent) {
      return { filename, url, hash };

    }

    // push to cloudinary
    try {
      const res = await this.handle(filename, 'remote', {
        fromImport: true, originalFilename: basename(url),
        originalLocation: hash,
      });

      return { filename, url: res.url, hash, imageId: res.id };
    }
    catch (e) {
      console.log(`Error uploading image to cloudinary`, e);
    }

  }
}
