import { Injectable, OnModuleInit } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IItemImage } from "~image/models/image.types";
import { IImageProcessingProvider } from "~image/models/providers.types";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IFileUploadHandlerResult } from "~root/upload/uploader.service";
import { ICloudinaryProviderConfig } from "~image/providers/cloudinary.provider";
import { basename } from "path";
import { SharedModule } from "~shared/shared.module";
import { ImageModel } from "~image/models/image.model";
const crypto = require('crypto')

export enum ImageEventNames {
  IMAGE_DELETED = 'image.deleted',
  IMAGE_CREATED = 'image.created',
  IMAGE_UPDATED = 'image.updated',
  IMAGE_DELETED_FROM_CLOUDINARY = 'image.deleted_from_cloudinary',
  IMAGE_DELETED_FROM_LOCAL = 'image.deleted_from_local',
  IMAGE_DELETED_FROM_REMOTE = 'image.deleted_from_remote',
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

  @OnEvent('app.loaded')
  async onAppLoaded() {
    ImageService.config = store.getState().configs['images'];
    const provider = McmsDiContainer.get({id: ImageService.config.provider});
    ImageService.provider = new provider.reference;
    ImageService.provider.setConfig(ImageService.config.cloudinary);
  }

  async delete(uuid: string, userId?: string) {
    const image = await this.findOne({uuid}) as ImageModel;
    await super.delete(uuid);
    SharedModule.eventEmitter.emit(ImageEventNames.IMAGE_DELETED, image)
    ImageService.provider.deleteResource(image)
    return {success: true};
  }

  // Full path or url
  async handle(file: string, type:'local'|'remote' = 'local',  metaData: any = {}): Promise<IFileUploadHandlerResult> {
    let url, id,res;
    const cloudinaryMetaData = {
      tags: ['from-upload'],
      metaData: `original_file=${encodeURI(basename(file))}`
    };
    if (process.env.ENV !== 'production') {
      cloudinaryMetaData.tags.push('dev');
    }


    if (type === 'local') {
      // url = await ImageService.provider.handleLocal(file);
      url = (process.env.ENV === 'production') ? await ImageService.provider.handleLocal(file, undefined, [])
        : await ImageService.provider.handleLocal(file, undefined, [], {folder: 'dev', cloudinaryMetaData} as unknown as ICloudinaryProviderConfig);
    }
    else {
      url = await ImageService.provider.handleRemote(file);
    }

    // save it to the db
    const newHash = crypto.createHash('md5').update(file).digest("hex");
    try {
      res = await this.store({...{
          active: true,
          url,
          originalLocation: newHash,
        }, ...metaData});

      id = res['uuid'];
    }

    catch (e) {
      console.log(e)
    }

    return {
      url,
      id
    }
  }


  async linkToObject(image: IItemImage, model: string, itemId: string, type='main', metaData: any = {}) {
    // There can be only one. Replace old main with new one. Old one remains linked but not as main
    const metaDataQuery = function(varName: string) {
      return Object.keys(metaData).map(key => `${varName}.${key} = '${metaData[key]}'`).join(',')
    };

    let typeQuery = '';
    //Reset old main image as a regular image
    if (type === 'main') {
      typeQuery = `
      WITH *
      OPTIONAL MATCH (model)-[r1:HAS_IMAGE]->(img:Image)
      WHERE r1.type = 'main'
      SET r1.type = 'image' ${metaDataQuery('r1').length ? `, ${metaDataQuery('r1')}` : ''}
      WITH image,model
      `;
    }

    const query = `MATCH (model:${model} {uuid:$itemId})
        MATCH (image:Image {uuid: $uuid})
        ${typeQuery}
        MERGE (model)-[r:HAS_IMAGE]->(image)
        ON MATCH SET r.type = $type, r.updatedAt = datetime() ${metaDataQuery('r').length ? `, ${metaDataQuery('r')}` : ''}
        ON CREATE SET r.type = $type, r.createdAt = datetime() ${metaDataQuery('r').length ? `, ${metaDataQuery('r')}` : ''}
        return *`;

    try {
      const res = this.neo.writeWithCleanUp(query, {
        itemId,
        uuid: image.uuid,
        type
      })

      return res;
    }
    catch (e) {
      console.log(e)
    }
  }

  async storeAndLinkToObject(name: string, model: string, type = 'main', itemId?: string, imageType?: string) {

  }

  async getItemImages(model: string, uuid: string, type?: string): Promise<IItemImage[]> {
    const typeQuery = (type) ? `WHERE r.type = '${type}'` : '';

    const query = `MATCH (model:${model} {uuid: $uuid})-[r:HAS_IMAGE]->(image) ${typeQuery}
         WITH * 
         RETURN image, r
         ORDER BY image.orderBy ASC`;
    // console.log(query)

    const res = await this.neo.readWithCleanUp(query, {uuid});

    return res.map(record => ({
      ...record.image,
      ...{type: record.r['type'] || null}
    }));
  }

  async unlinkFromObject(uuid: string, model: string, type: string) {

  }

  groupImagesByType(images: IItemImage[]): {[key: string]: IItemImage[]} {
    return {}
  }

  private formatItem(item: any) {

  }


}
