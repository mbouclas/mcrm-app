import { Injectable } from '@nestjs/common';
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IGenericObject, IPagination } from "~models/general";
const humanObjectDiff = require("human-object-diff");

export interface IBaseLogEntry {
  old: string|number|boolean|object;
  new: string|number|boolean|object;
}

@Injectable()
export class ChangeLogService extends BaseNeoService{
  async findOne(filter: IGenericObject, rels: string[] = []) {
    const r = await super.findOne(filter, rels);

    return r;
  }

  async find(params: IGenericObject = {},start?: Date, end?: Date) {
    const r = await super.find(params);

    return r;
  }

  async add(node: string, uuid: string, action:"added"|"updated"|"deleted", object: {currentState: any, previousState: any}|null, userUuid?: string) {

  }

  async saveEntry(node: string, uuid: string, action:"added"|"updated"|"deleted", changes: IBaseLogEntry, parentId?: string) {
    if (process.env.LOG_ENTRIES_ON && process.env.LOG_ENTRIES_ON === 'none') {
      return;
    }
  }



  calculateDiff(oldState: any, currentState: any) {
    if (typeof oldState === 'string') {
      oldState = JSON.parse(oldState);
    }

    if (typeof currentState === 'string') {
      currentState = JSON.parse(currentState);
    }
    const d = new humanObjectDiff();

    return d.diff(currentState, oldState);
  }

}
