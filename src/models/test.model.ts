import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { getAllModels, getPropertiesWithMetadata, McrmModel, Property } from "~neo4j/neo4j.decorators";
import { Injectable } from "@nestjs/common";
import { store } from "~root/state";

@McrmModel('Test')
@Injectable()
export class TestModel extends BaseModel {

  @Property({type: 'text', label: 'Title', varName: 'title', required: true})
  public title: string;

  @Property({type: 'text', label: 'Slug', varName: 'slug', required: true, isSlug: true, slugFrom: 'title'})
  public slug;

  async onApplicationBootstrap() {
    setTimeout(async () => {

      getAllModels().forEach(model => {
        // console.log(model['modelName'])
        // console.log(getPropertiesWithMetadata(model))
      })

// console.log(store.getState().models['Test'].fields);
    }, 1000);
  }

  public static modelConfig: INeo4jModel = {
    select: 'test:Test',
    as: 'test',
    relationships: {}
  };
}
