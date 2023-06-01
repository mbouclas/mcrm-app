import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { PropertyValueModel } from '~catalogue/property/models/property-value.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';

export class PropertyValueDto {
  name?: string;
  type?: string;
  image?: string;
  icon?: string;
  slug?: string;
}

@Injectable()
export class PropertyValueService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.PropertyValue;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {}

  async findOne(filter: IGenericObject, rels = []): Promise<PropertyValueModel> {
    const item = (await super.findOne(filter, rels)) as unknown as PropertyValueModel;
    return item;
  }

  async store(record: PropertyValueDto, userId?: string) {
    const r = await super.store(record, userId);
    return r;
  }

  async update(uuid: string, record: PropertyValueDto, userId?: string) {
    const r = await super.update(uuid, record, userId);

    return r;
  }
}
