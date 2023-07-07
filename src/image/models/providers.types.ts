import { IImageBlueprint, IItemImage } from "~image/models/image.types";
import { CommonTransformationOptions } from "cloudinary";
import { ICloudinaryProviderConfig } from "~image/providers/cloudinary.provider";
import { BaseModel } from "~models/base.model";
import { ImageModel } from "~image/models/image.model";

export interface IImageProcessingProviderConfig {}

export interface IImageProcessingProvider {
  service: any;
  upload: (file: string, imageId?: string, transformations?: any[]) => any;
  setupCopies: (image: IItemImage, imageConfig: IImageBlueprint) => IItemImage;
  getResource: (id: string) => any;
  setConfig: (config: IImageProcessingProviderConfig) => any;
  handleLocal: (filename: string, imageId?: string, transformations?: CommonTransformationOptions[], settings?: ICloudinaryProviderConfig) => any ;
  handleRemote: (url: string, imageId?: string, transformations?: CommonTransformationOptions[], settings?: ICloudinaryProviderConfig) => any ;
  deleteResource: (image: ImageModel) => void;
}
