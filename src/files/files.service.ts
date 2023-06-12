import { BaseNeoService } from "~shared/services/base-neo.service";
import { Injectable } from "@nestjs/common";
import { OnEvent } from '@nestjs/event-emitter';
import { store } from "~root/state";
import { FileNotFoundException } from "~files/exceptions/file-not-found.exception";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";

export enum FileEventNames {
  FileUploaded = 'file.uploaded',
  FileDeleted = 'file.deleted',
}

export interface IUploadedFileResponse {
  url: string;
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

  async getFile(filename: string) {
    let found;
    try {
      found = await this.findOne({filename});
    }
    catch (e) {
      throw new FileNotFoundException('FILE_NOT_FOUND', '100.10');
    }

    // get the file depending on the driver
    let file: IUploadedFileResponse;

    switch (found.driver) {
      case 'local': {
        file = {
          url: ``
        }
      }
        break;
      case 'object-storage': {
        const oss = new ObjectStorageService();

        file = {
          url: await oss.getObjectUrl(found.bucket, found.filename),
        }
      }
      break;
    }

    return file;
  }
}
