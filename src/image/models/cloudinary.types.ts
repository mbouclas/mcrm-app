import { UploadApiResponse, CommonTransformationOptions } from 'cloudinary';

export interface ICloudinaryEagerTransformationResult {
  transformation: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  url: string;
  secure_url: string;
}

export interface ICloudinaryUploadResponse extends UploadApiResponse{
  eager?: ICloudinaryEagerTransformationResult[];
}


export interface ICloudinaryEagerAsync {
  status: string;
  batch_id: string;
  url: string;
  secure_url: string;
}

export interface ICloudinaryAsyncUploadResponse {
  notification_type: string;
  timestamp: Date;
  request_id: string;
  public_id: string;
  version: number;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: Date;
  tags: any[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
  eager: ICloudinaryEagerAsync[];
}

export interface ICloudinaryEager {
  transformation: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  url: string;
  secure_url: string;
}

export interface ICloudinaryAsyncEagerResponse {
  notification_type: string;
  timestamp: Date;
  request_id: string;
  eager: ICloudinaryEager[];
  batch_id: string;
  public_id: string;
}
