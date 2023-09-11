import { Injectable } from '@nestjs/common';
import { ChangeLogService } from '~change-log/change-log.service';
import { store } from '~root/state';
import { OnEvent } from '@nestjs/event-emitter';
import { ImportTemplateModel } from '~catalogue/import/models/import-template.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { IGenericObject } from '~models/general';

@Injectable()
export class ImportTemplateService extends BaseNeoService {
  protected changeLog: ChangeLogService;

  constructor() {
    super();
    this.model = store.getState().models.ImportTemplate;

    this.changeLog = new ChangeLogService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() { }

  async findOne(filter: IGenericObject, rels = []): Promise<ImportTemplateModel> {
    const item = (await super.findOne(filter, rels)) as unknown as ImportTemplateModel;
    return item;
  }
}
