export interface IBaseBucketListResponse {
    name: string;
    creationDate: Date;
}

export interface ICreatedBucketResponse {
    success: boolean;
    location: string;
}

export interface IBaseObjectStatResponse {
    size: number;
    etag: string;
    lastModified: Date;
    metaData?: BaseObjectMeta;
}

export interface IObjectCreateResponse {
    etag: string;
    file: string;
    filename: string;
    bucket: string;
}

export interface IListObjectItem {
    name: string;
    prefix: string;
    size: number;
    etag: string;
    lastModified: Date;
    meta?: BaseObjectMeta;
    url?: string;
}

export interface IListObjectsOptions {
    withUrl?: boolean;
    withMeta?: boolean;
    urlExpiry?: number;
}

export interface IObjectContents {
    contents: string;
    size: number;
}

export interface IBaseObjectStorageDriver {
    listBuckets(): Promise<IBaseBucketListResponse[]>;
    createBucket(name: string): Promise<ICreatedBucketResponse>;
    bucketExists(name: string): Promise<boolean>;
    objectExists(bucketName: string, filename: string): Promise<boolean>;
    statObject(bucketName: string, filename: string): Promise<IBaseObjectStatResponse>;
    listObjects(bucketName: string, options?: IListObjectsOptions): Promise<IListObjectItem[]>;
    uploadFile(bucketName: string, file: string, meta: BaseObjectMeta): Promise<any>;
    deleteFile(bucketName: string, filename: string): Promise<boolean>;
    getFileUrl(bucketName: string, filename: string, duration?: number): Promise<string>;
    deleteBucket(name: string): Promise<boolean>;
    downloadObject(bucketName: string, filename: string, targetLocation: string): Promise<boolean>
    setBucketPolicy(bucketName: string, policy: string, resource: string): Promise<boolean>;
    bucketExistsOrCreate(name: string): Promise<boolean>;
    getObject(bucket: string, filename: string): Promise<IObjectContents>;
}

export class BaseObjectMeta {
    [key: string]: any;
}
