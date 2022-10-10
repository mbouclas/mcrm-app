import { IImageBlueprint, IItemImage } from "~image/models/image.types";

export interface IImageProcessingProviderConfig {}

export interface IImageProcessingProvider {
  service: any;
  upload: (file: string, imageId?: string, transformations?: any[]) => any;
  setupCopies: (image: IItemImage, imageConfig: IImageBlueprint) => IItemImage;
  getResource: (id: string) => any;
  setConfig: (config: IImageProcessingProviderConfig) => any;
  handleLocal: (filename: string) => any ;
  handleRemote: (url: string) => any ;
}
