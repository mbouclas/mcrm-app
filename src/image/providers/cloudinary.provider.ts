import { IImageProcessingProvider, IImageProcessingProviderConfig } from "~image/models/providers.types";
import * as cloudinary from 'cloudinary';
import { CommonTransformationOptions } from 'cloudinary';
import { ICloudinaryEager, ICloudinaryUploadResponse } from "~image/models/cloudinary.types";
import { IImageBlueprint, IImageCopyBlueprint, IItemImage } from "~image/models/image.types";
import { v4 } from "uuid";
import { CloudinaryUploadFailedException } from "~image/exceptions/CloudinaryUploadFailedException";
import { IGenericObject } from "~models/general";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { ImageModel } from "~image/models/image.model";


export interface ICloudinaryProviderConfig extends IImageProcessingProviderConfig{
  use_filename: boolean;
  unique_filename: boolean;
  overwrite: boolean;
  folder?: string;
  asyncUploads?: boolean;
  metaData?: IGenericObject;
  cloudinaryMetaData?: IGenericObject;
}

@McmsDi({
  id: 'CloudinaryProvider',
  type: "class"
})
export class CloudinaryProvider implements IImageProcessingProvider{
  public service = cloudinary.v2;
  protected config: ICloudinaryProviderConfig;
  constructor() {

  }

  public setConfig(config: ICloudinaryProviderConfig) {
    this.config = config;
    return this;
  }

  async handleLocal(filename: string, imageId = undefined, transformations = [], settings: ICloudinaryProviderConfig = undefined) {
    const res = await this.upload(filename, imageId, transformations, settings);

    return res.secure_url;
  }

  async handleRemote(url: string, imageId = undefined, transformations = [], settings: ICloudinaryProviderConfig = undefined) {
    const res = await this.upload(url, imageId, transformations, settings);

    return res.secure_url;
  }

  /**
   * file can be a url or a file path
   * @param file
   * @param imageId
   * @param transformations
   * @param settings
   */
  async upload(file: string, imageId?: string, transformations: CommonTransformationOptions[] = [], settings: ICloudinaryProviderConfig = undefined): Promise<ICloudinaryUploadResponse> {
    let res;
    imageId = (!imageId) ? v4() : imageId;
    if (this.config && this.config.folder) {
      imageId = `${this.config.folder}/${imageId}`;
    }
    const async = (this.config && this.config.asyncUploads) ? this.config.asyncUploads : false;

    try {
      const eager = transformations;
      res = await this.service.uploader.upload(file, {
        async,
        eager_async: true,
        public_id: imageId,
        use_filename: settings && settings.use_filename || true,
        folder: settings && settings.folder || this.config.folder,
        tags: settings && settings.cloudinaryMetaData && settings.cloudinaryMetaData.tags || [],
        // metadata: settings && settings.cloudinaryMetaData && settings.cloudinaryMetaData.metaData || undefined,
        notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
        eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
        eager,
      });

      return {...{async: true}, ...res};
    }
    catch (e) {
      throw new CloudinaryUploadFailedException(e);
    }

  }

  setupCopies(image: IItemImage, imageConfig: IImageBlueprint): IItemImage {
    if (!image.eager || typeof image.eager === 'undefined') { return image;}
    const copies: IGenericObject = {};
    if (typeof image.eager === 'string') {image.eager = JSON.parse(image.eager);}

    // to get a copy we need to find a transformation with the exact dimensions on w and h
    for (let key in imageConfig.copies) {
      const copy = imageConfig.copies[key];
      const idx = this.findCopyIndex(copy, image.eager as ICloudinaryEager[]);
      if (idx === -1) {continue;}

      copies[key] = {
        url: image.eager![idx].secure_url,
        adminDefault: copy.adminDefault
      };
    }

    image.copies = copies;

    return image;
  }

  private findCopyIndex(copy: IImageCopyBlueprint, transformations: ICloudinaryEager[]) {
    let idx = -1;
    for (let k=0; transformations.length > k; k++) {
      const regex = new RegExp(`(h_${copy.height}).*(w_${copy.width})`, 'gm');
      if (!transformations[k].transformation.match(regex)) {continue;}

      idx = k;
    }

    return idx;
  }

  async getResource(id: string) {
    return  await this.service.api.resource(id);
  }

  // pull image from cloudinary
  async deleteResource(image: ImageModel) {
    let res;
    try {
      res = await this.service.uploader.destroy(this.extractPublicId(image.url));
    }
    catch (e) {
      console.log(`Failed to delete image ${image.url} from cloudinary`);
    }

    return res;
  }

  extractPublicId(url: string) {
    const regex = /\/v\d+\/([^\.]+)/;
    const match = url.match(regex);
    return match[1];
  }
}
