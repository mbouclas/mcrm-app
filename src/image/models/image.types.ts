import { IBaseMultiLingualField } from "~models/general";
import { ICloudinaryEager } from "~image/models/cloudinary.types";

export interface IImageTypeSettingsBlueprint {
  default: boolean;
}

export interface IImageCopyBlueprint {
  width: number;
  height: number;
  quality?: number;
  prefix?: string;
  crop: "fill"|"fit"|"stretch";
  dir: string;
  adminDefault?: boolean;
  url?: string;
}

export interface IImageTypeBlueprint {
  name: string;
  title: string;
  settings?: IImageTypeSettingsBlueprint;
  copies?: {[key: string]: IImageCopyBlueprint};
  uploadAs?: string;
}

export interface IImageBlueprint {
  keepOriginals: boolean;
  optimize: boolean;
  async?: boolean;
  maxFileSize?: number;
  savePath?: string;
  dirPattern?: string;
  filePattern?: string;
  recommendedSize?: string;
  afterUpload?: string;
  types: IImageTypeBlueprint[];
  copies: {[key: string]: IImageCopyBlueprint};
}

export interface IBaseImageCopy {
  url: string;
  path?: string;
  filename?: string;
}

export interface IBaseItemImageCopy  {
  [key: string]: IBaseImageCopy;
}

export interface IItemImage {
  uuid?: string;
  title?: IBaseMultiLingualField;
  alt?: IBaseMultiLingualField;
  description?: IBaseMultiLingualField;
  copies?: IBaseItemImageCopy;
  eager?: ICloudinaryEager[];
  orderBy?: number;
  active?: boolean;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
