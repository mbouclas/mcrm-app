import { BaseNeoService } from "~shared/services/base-neo.service";
import { Injectable } from "@nestjs/common";
import { OnEvent } from '@nestjs/event-emitter';
import { store } from "~root/state";
import { FileNotFoundException } from "~files/exceptions/file-not-found.exception";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { IGenericObject } from "~models/general";
import { IObjectContents } from "~root/object-storage/BaseObjectStorageDriver";

export enum FileEventNames {
  FileUploaded = 'file.uploaded',
  FileDeleted = 'file.deleted',
}

export interface IUploadedFileResponse {
  url?: string;
  mimeType?: string;
  buffer?: IObjectContents;
}

@Injectable()
export class FilesService extends BaseNeoService {
  constructor() {
    super();
    this.model = store.getState().models.File;
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {

  }

  @OnEvent(FileEventNames.FileUploaded)
  async onFileUploaded(filename: string) {
    return filename;
  }

  @OnEvent(FileEventNames.FileDeleted)
  async onFileDeleted(filename: string) {

  }

  async getFile(filter: IGenericObject, returnContents: boolean = false): Promise<IUploadedFileResponse> {
    let found;
    try {
      found = await this.findOne(filter);
    }
    catch (e) {
      throw new FileNotFoundException('FILE_NOT_FOUND', '100.10');
    }

    // get the file depending on the driver
    let file: IUploadedFileResponse;

    switch (found.driver) {
      //todo: add local driver
      case 'local': {
        file = {
          url: ``
        }
      }
        break;
      case 'object-storage': {
        const oss = new ObjectStorageService();

        file = returnContents ? {
          buffer: await oss.getObject(found.bucket, found.filename),
          mimeType: found.mimeType,
        } : {
          url: await oss.getObjectUrl(found.bucket, found.filename),
          mimeType: found.mimeType,
        }
      }
      break;
    }

    return file;
  }
}
