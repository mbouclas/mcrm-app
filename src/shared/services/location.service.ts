import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IGenericObject, IPagination } from "~models/general";
import { store } from "~root/state";
import { BaseModel } from "~models/base.model";
import { LocationModel } from "~shared/models/location.model";
import { BaseNeoService } from "~shared/services/base-neo.service";

export class LocationModelDto {

}

@McmsDi({
  id: 'LocationService',
  type: 'service'
})
@Injectable()
export class LocationService extends BaseNeoService {
  protected relationships = [];
  protected moduleName = 'shared';
  private modelName = 'Location';
  protected model: typeof LocationModel;

  constructor() {
    super();
    // this.model = store.getState().models.Location;

  }

  async findOne(filter: IGenericObject, relationships: string[] = []): Promise<LocationModel> {
    return ;
  }

  async find<LocationModel>(params: IGenericObject = {}): Promise<IPagination<LocationModel>> {
    return ;
  }

  async store(record: LocationModelDto, userId?: string) {

  }

  async update(uuid: string, record: LocationModelDto, userId?: string) {

  }

  async delete(uuid: string, userId?: string) {
    return await super.delete(uuid, userId);
  }
}
