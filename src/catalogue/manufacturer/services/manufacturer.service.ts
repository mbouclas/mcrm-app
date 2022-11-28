import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { ManufacturerModel } from '~catalogue/manufacturer/models/manufacturer.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';

export class ManufacturerModelDto {
  title?: string;
  slug?: string;
  status?: boolean;
}

@Injectable()
export class ManufacturerService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.Manufacturer;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<ManufacturerModel> {
    const item = (await super.findOne(
      filter,
      rels,
    )) as unknown as ManufacturerModel;
    return item;
  }

  async store(record: ManufacturerModelDto, userId?: string) {
    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid: string, record: ManufacturerModelDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
