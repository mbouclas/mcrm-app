import { Injectable, OnModuleInit } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IItemImage } from "~image/models/image.types";
import { IImageProcessingProvider } from "~image/models/providers.types";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { IFileUploadHandlerResult } from "~root/upload/uploader.service";


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

  // Full path or url
  async handle(file: string, type:'local'|'remote' = 'local'): Promise<IFileUploadHandlerResult> {
    let url, id,res;
    if (type === 'local') {
      // url = await ImageService.provider.handleLocal(file);
      url = (process.env.ENV === 'production') ? await ImageService.provider.handleLocal(file) : 'https://res.cloudinary.com/businesslink/image/upload/v1662548134/rps/b3eaf906-a112-46c5-aeef-d5c125864b23.png';
    }
    else {
      url = await ImageService.provider.handleRemote(file);
    }

    // save it to the db
    try {
      res = await this.store({
        active: true,
        url,
      });

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


  async linkToObject(image: IItemImage, model: string, itemId: string, type='main') {
    // There can be only one. Replace old main with new one. Old one remains linked but not as main
    let typeQuery;
    if (type === 'main') {
      typeQuery = `
      WITH *
      OPTIONAL MATCH (model)-[r1:HAS_IMAGE]->(img:Image)
      SET r1.type = null
      WITH image,model
      `;
    }

    const query = `MATCH (model:${model} {uuid:$itemId})
        MATCH (image:Image {uuid: $uuid})
        ${typeQuery}
        MERGE (model)-[r:HAS_IMAGE]->(image)
        ON MATCH SET r.type = $type, r.updatedAt = datetime()
        ON CREATE SET r.type = $type, r.createdAt = datetime()
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
    console.log(query)

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
