import {
    BaseObjectMeta,
    IBaseObjectStatResponse,
    IBaseObjectStorageDriver,
    ICreatedBucketResponse, IListObjectsOptions
} from "./BaseObjectStorageDriver";
import {Client} from 'minio';
import {ObjectStorageErrorException} from "./exceptions/ObjectStorageError.exception";
import * as path from "path";
import {CreateObjectException} from "./exceptions/CreateObject.exception";
import {ObjectNotFoundException} from "./exceptions/ObjectNotFound.exception";
import {ObjectDownloadException} from "./exceptions/ObjectDownload.exception";
import {CannotApplyBucketPolicyException} from "./exceptions/CannotApplyBucketPolicy.exception";
import {S3PolicyManager} from "./S3PolicyManager";
import { readFile } from "fs/promises";

export class MinioDriver implements IBaseObjectStorageDriver {
    client: Client;

    constructor() {
        this.client = new Client({
            endPoint: process.env.OBJECT_STORAGE_ENDPOINT as string,
            port: parseInt(process.env.OBJECT_STORAGE_PORT as string) as number,
            useSSL: (process.env.OBJECT_STORAGE_USE_SSL as string === 'true'),
            accessKey: process.env.OBJECT_STORAGE_ACCESS_KEY as string,
            secretKey: process.env.OBJECT_STORAGE_SECTRET as string,
        });
    }

    async createBucket(name: string): Promise<ICreatedBucketResponse> {
        if (await this.bucketExists(name)) {
            return {success: true, location: `/${name}`};
        }

        await this.client.makeBucket(name, '');
        return {success: true, location: `/${name}`};
    }

    async bucketExists(name: any) {
        try {
            return await this.client.bucketExists(name);
        }
        catch (e) {
            throw new ObjectStorageErrorException(`Bucket Exists Error: ${e}`);
        }
    }

    async bucketExistsOrCreate(name: string) {
        if (await this.bucketExists(name)) {
            return true;
        }

        await this.createBucket(name);

        return true;
    }

    async objectExists(bucketName: string, filename: string): Promise<boolean> {
        try {
            await this.statObject(bucketName, filename);
        }
        catch (e) {
            return false;
        }

        return true;
    }

    async listObjects(bucketName: string, options: IListObjectsOptions): Promise<any> {
        const config = Object.assign({}, {withMeta: false, withUrl: false, urlExpiry: 24*60*60 }, options);
        const Stream = this.client.listObjects(bucketName);

        return new Promise((resolve, reject) => {
            const objects: any = [];
            const ret: any = [];
            Stream.on('data', async (obj) => {
                objects.push(obj);

            })

            Stream.on('end', async () => {
                for (let idx = 0; objects.length > idx;idx++) {
                    const obj = objects[idx];
                    let url,
                    meta;


                    if (config.withUrl) {
                        url = await this.client.presignedUrl('GET', bucketName, obj.name, config.urlExpiry);
                    }

                    if (config.withMeta) {
                        meta = await this.client.statObject(bucketName, obj.name);
                    }


                    ret.push(Object.assign({}, obj, {meta}, {url}));
                }


                resolve(ret);
            })
            Stream.on('error', function(err) {
                console.log('Error while listing objects',err)
            })
        });
    }

    async uploadFile(bucketName: string, file: string, meta: BaseObjectMeta): Promise<any> {
        try {
            return await this.client.fPutObject(bucketName, path.basename(file), file, meta);
        }
        catch (e) {
            throw new CreateObjectException(e);
        }
    }
    async deleteFile(bucketName: string, filename: string): Promise<boolean> {
        if (!await this.objectExists(bucketName, filename)) {
            return false;
        }

        try {
            await this.client.removeObject(bucketName, filename);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async getFileUrl(bucketName: string, filename: string, expiry = 24*60*60): Promise<string> {
        if (!await this.objectExists(bucketName, filename)) {
            throw new ObjectNotFoundException(filename);
        }

        return await this.client.presignedUrl('GET', bucketName, filename, expiry);
    }

    async listBuckets() {
        return  await this.client.listBuckets();
    }

    async deleteBucket(name: string): Promise<boolean> {
        if (!await this.client.bucketExists(name)) {
            return false;
        }

        try {
            await this.client.removeBucket(name);

            return true;
        }
        catch (e) {
            throw new ObjectStorageErrorException(`Delete Bucket Error: ${e}`);
        }
    }

    async statObject(bucketName: string, filename: string): Promise<IBaseObjectStatResponse> {
        return await this.client.statObject(bucketName, filename);
    }

    async downloadObject(bucketName: string, filename: string, targetLocation: string): Promise<boolean> {
        try {
            await this.client.fGetObject(bucketName, filename, targetLocation);
        }
        catch (e) {
            throw new ObjectDownloadException(e);
        }

        return true;
    }

    async setBucketPolicy(bucketName: string, policy: string, resource: string) {
        const policyManager = new S3PolicyManager();
        try {
            await this.client.setBucketPolicy(bucketName, JSON.stringify(policyManager.policy(policy, resource)));
        }
        catch (e) {
            throw new CannotApplyBucketPolicyException(e);
        }

        return true;
    }

    async getObject(bucket: string, filename: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let dataStream,
                size = 0,
                contents = '';


            try {
                dataStream = await this.client.getObject(bucket, filename);
            }
            catch (e) {
                return reject(e);
            }

            dataStream.on('data', function(chunk) {
                size += chunk.length
                contents += chunk;
            });

            dataStream.on('end', function() {
                resolve({contents,size});
            });

            dataStream.on('error', function(err) {
                console.log(err)
            });
        });
    }

}
