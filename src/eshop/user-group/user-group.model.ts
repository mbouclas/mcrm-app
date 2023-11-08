import { BaseModel, INeo4jModel } from "~models/base.model";
import { McrmModel, Property } from "~neo4j/neo4j.decorators";
import { Injectable } from "@nestjs/common";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";

@McrmModel('UserGroup')
@Injectable()
export class UserGroupModel extends BaseModel {
  public uuid: string;
  @Property({type: 'text', label: 'Title', varName: 'title', required: true, isReadOnly: true})
  public title: string;

  @Property({type: 'text', label: 'Slug', varName: 'slug', required: true, isSlug: true, slugFrom: 'title', isReadOnly: true})
  public slug;

  @Property({type: 'boolean', label: 'Active', varName: 'active', required: true, group: 'main', isReadOnly: true})
  public active: string;

  @Property({type: 'boolean', label: 'Default', varName: 'default', required: true, group: 'main', isReadOnly: true})
  public default: boolean;

  @Property({type: 'markdown', label: 'Description', varName: 'description', required: true, isReadOnly: true})
  public description: string;

  public static modelConfig: INeo4jModel = {
    select: 'ug:UserGroup',
    as: 'ug',
    relationships: {}
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'UserGroup',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'active',
      label: 'Active',
      type: 'boolean',
      model: 'UserGroup',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'default',
      label: 'Default',
      type: 'boolean',
      model: 'UserGroup',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  onApplicationBootstrap() {
    setTimeout(async () => {
      await this.install();
    });
  }

  async install() {
    const neo = new BaseNeoService();
    const resConstraints = await neo.neo.readWithCleanUp(`SHOW CONSTRAINTS;`)
    const constraints = resConstraints.map(r => r.labelsOrTypes[0]);
    const found = constraints.filter(c => c.indexOf('UserGroup') > -1);

    if (found.length > 0) {
      return;
    }

    try {
      await neo.neo.write(`CREATE CONSTRAINT FOR (n:UserGroup) REQUIRE n.uuid IS UNIQUE;`)
    }
    catch (e) {
      console.log(`COULD NOT CREATE CONSTRAINT FOR UserGroup`, e);
    }

    try {
      await neo.neo.write(`CALL apoc.uuid.install('UserGroup');`)
    }
    catch (e) {
      console.log(`COULD NOT install apoc.uuid for UserGroup`, e);
    }

    try {
      await neo.neo.write(`
            MERGE (n: UserGroup {slug: 'default'})
ON CREATE SET n.title = 'Default', n.default = true, n.createdAt = datetime(), n.description = 'Default User Group'
ON MATCH SET n.updatedAt = datetime()
return n;
`);
    }
    catch (e) {
      console.log(`COULD NOT CREATE DEFAULT UserGroup`, e);
    }

  }
}
