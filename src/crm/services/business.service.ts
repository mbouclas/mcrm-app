import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IGenericObject, IPagination } from "~models/general";
import { BusinessModel } from "../models/business.model";
import { store } from "~root/state";
import { BaseModel } from "~models/base.model";


export class BusinessModelDto {

}

@McmsDi({
  id: 'BusinessService',
  type: 'service'
})
@Injectable()
export class BusinessService {
  protected relationships = [];
  protected moduleName = 'crm';
  private modelName = 'Business';
  protected model: typeof BaseModel;

  constructor() {
    this.model = store.getState().models.Business;
  }

  async findOne(filter: IGenericObject, relationships: string[] = []): Promise<BusinessModel> {
    return ;
  }

  async find(params: IGenericObject = {}): Promise<IPagination<BusinessModel>> {
    return ;
  }

  async store(record: BusinessModelDto, userId?: string) {

  }

  async update(uuid: string, record: BusinessModelDto, userId?: string) {

  }

  async delete(uuid: string, userId?: string) {

  }
}
