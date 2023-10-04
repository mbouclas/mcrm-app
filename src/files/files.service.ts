import { BaseNeoService } from "~shared/services/base-neo.service";
import { Injectable } from "@nestjs/common";
import { OnEvent } from '@nestjs/event-emitter';
import { store } from "~root/state";
import { FileNotFoundException } from "~files/exceptions/file-not-found.exception";
import { ObjectStorageService } from "~root/object-storage/ObjectStorage.service";
import { IGenericObject } from "~models/general";
import { IObjectContents } from "~root/object-storage/BaseObjectStorageDriver";
import { ReadStream, unlinkSync } from "fs";
import { rm, unlink } from "fs/promises";

export enum FileEventNames {
  FileUploaded = 'file.uploaded',
  FileDeleted = 'file.deleted',
  FileDownloaded = 'file.downloaded',
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

  @OnEvent(FileEventNames.FileDownloaded)
  async onFileDownloaded(filename: string) {
    // remove the temp file
    setTimeout(async () => {
      try {
        unlinkSync(filename);
      }
      catch (e) {
        console.log(`Error removing temp file ${filename}: ${e.message}`);
      }
    }, 1000)
  }

  async getFile(filter: IGenericObject, returnContents: boolean = false): Promise<IUploadedFileResponse|ReadStream> {
    let found;
    try {
      found = await this.findOne(filter);
    }
    catch (e) {
      throw new FileNotFoundException('FILE_NOT_FOUND', '100.10');
    }

    // get the file depending on the driver
    let file: IUploadedFileResponse|ReadStream;

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
        if (!returnContents) {
          file = {
            url: await oss.getObjectUrl(found.bucket, found.filename),
            mimeType: found.mimeType,
          };
        }

        file = await oss.getObjectStream(found.bucket, found.filename);
      }
      break;
    }

    return file;
  }
}
