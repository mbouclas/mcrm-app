import {
    BaseObjectMeta,
    IBaseBucketListResponse, IBaseObjectStatResponse,
    IBaseObjectStorageDriver,
    ICreatedBucketResponse
} from "./BaseObjectStorageDriver";

export class AwsDriver implements IBaseObjectStorageDriver {
    getObjectStream(bucket: string, filename: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    bucketExists(name: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    createBucket(name: string): Promise<ICreatedBucketResponse> {
        return Promise.resolve({success: true, location: ''});
    }

    deleteFile(bucketName: string, filename: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    getFileUrl(bucketName: string, filename: string, duration: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    listBuckets(): Promise<IBaseBucketListResponse[]> {
        return Promise.resolve([]);
    }

    listObjects(bucketName: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    objectExists(bucketName: string, filename: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    uploadFile(bucketName: string, file: string, meta: BaseObjectMeta): Promise<any> {
        return Promise.resolve(undefined);
    }

    deleteBucket(name: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    statObject(bucketName: string, filename: string): Promise<IBaseObjectStatResponse> {
        return Promise.resolve({} as any);
    }

    downloadObject(bucketName: string, filename: string, targetLocation: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    setBucketPolicy(bucketName: string, policy: string, resource: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    bucketExistsOrCreate(name: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    getObject(bucket: string, filename: string): Promise<any> {
        return Promise.resolve(undefined);
    }

}
