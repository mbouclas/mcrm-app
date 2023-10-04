// Get the driver from .env or use default
import {
    BaseObjectMeta,
    IBaseBucketListResponse,
    IBaseObjectStatResponse,
    IBaseObjectStorageDriver,
    ICreatedBucketResponse, IListObjectItem, IListObjectsOptions, IObjectCreateResponse
} from "./BaseObjectStorageDriver";
import {DriverNotFoundException} from "./exceptions/DriverNotFound.exception";
import {MinioDriver} from "./minio.driver";
import {AwsDriver} from "./aws.driver";
import {ObjectNotFoundException} from "./exceptions/ObjectNotFound.exception";
import {basename} from "path";

import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";

@McmsDi({
    id: 'ObjectStorageService',
    type: 'service',
})
export class ObjectStorageService {
    availableDrivers: {[key: string]: any} = {
        minio: MinioDriver,
        aws: AwsDriver
    };

    driver: IBaseObjectStorageDriver;

    constructor(driver?: string) {
        if (!driver && !process.env.OBJECT_STORAGE_DRIVER) {
            throw new DriverNotFoundException('No driver found');
        }

        const key = driver as string || process.env.OBJECT_STORAGE_DRIVER as string;
        if (!this.availableDrivers[key]) {
            // check the availableDrivers list
            throw new DriverNotFoundException(`Driver ${key} is not listed`);
        }

        this.driver = new this.availableDrivers[key]();
    }

    async listBuckets(): Promise<IBaseBucketListResponse[]> {
        return await this.driver.listBuckets();
    }

    async createBucket(name: string): Promise<ICreatedBucketResponse> {
        return await this.driver.createBucket(name);
    }

    async deleteBucket(name: string): Promise<boolean> {
        return await this.driver.deleteBucket(name);
    }

    async bucketExists(name: string): Promise<boolean> {
        return await this.driver.bucketExists(name);
    }

    async bucketExistsOrCreate(name: string): Promise<boolean> {
        return await this.driver.bucketExistsOrCreate(name);
    }

    async statObject(bucketName: string, filename: string): Promise<IBaseObjectStatResponse> {
        try {
            return  await this.driver.statObject(bucketName, filename);
        }
        catch (e) {
            throw new ObjectNotFoundException(e);
        }
    }

    async createObject(bucket: string, file: string, meta: BaseObjectMeta): Promise<IObjectCreateResponse> {
        const etag = await this.driver.uploadFile(bucket, file, meta);
        return {etag, file, filename: basename(file), bucket: bucket};
    }

    async deleteObject(bucket: string, file: string): Promise<boolean> {
        return await this.driver.deleteFile(bucket, file);
    }

    async listObjects(bucket: string, options: IListObjectsOptions): Promise<IListObjectItem[]> {
        return await this.driver.listObjects(bucket, Object.assign({}, {withMeta: false, withUrl: false, urlExpiry: 24*60*60 }, options));
    }

    async getObjectUrl(bucket: string, filename: string, expiry = 24*60*60): Promise<string> {
        const url = await this.driver.getFileUrl(bucket, filename, expiry);
        if (!process.env.OBJECT_STORAGE_PUBLIC_URL) {
            return url;
        }

        return url.replace(`http://localhost:${process.env.OBJECT_STORAGE_PORT}`, process.env.OBJECT_STORAGE_PUBLIC_URL);
    }

    async getObject(bucket: string, filename: string) {
        return await this.driver.getObject(bucket, filename);
    }

    async getObjectStream(bucket: string, filename: string) {
        return this.driver.getObjectStream(bucket, filename);
    }

    async downloadObject(bucketName: string, filename: string, targetLocation: string): Promise<boolean> {
        return await this.driver.downloadObject(bucketName, filename, targetLocation);
    }

    async setBucketPolicy(bucketName: string, policy: string, resource: string) {
        return await this.driver.setBucketPolicy(bucketName, policy, resource);
    }
}
