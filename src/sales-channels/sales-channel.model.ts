import { McrmModel, Property } from "~neo4j/neo4j.decorators";
import { Injectable } from "@nestjs/common";
import { BaseModel, INeo4jModel } from "~models/base.model";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import {z} from 'zod';
import { BaseNeoService } from "~shared/services/base-neo.service";

const settingsSchema = z.object({
  isDefault: z.boolean().describe('Is this the default sales channel'),
  entryPoint: z.string().optional().describe('The entry point for the sales channel'),
  urls: z.array(z.object({
    url: z.string().optional().describe('The url for the sales channel'),
    currency: z.string().optional().describe('The currency for the sales channel'),
    language: z.string().optional().describe('The language for the sales channel'),
  })).optional().describe('The urls for the sales channel'),
});

@McrmModel('SalesChannel')
@Injectable()
export class SalesChannelModel extends BaseModel {
  onApplicationBootstrap() {
    setTimeout(async () => {
      await this.install();
    });
  }
  @Property({type: 'text', label: 'Title', varName: 'title', required: true, group: 'main'})
  public title: string;

  @Property({type: 'text', label: 'Slug', varName: 'slug', required: true, isSlug: true, slugFrom: 'title', group: 'hidden'})
  public slug;

  @Property({type: 'text', label: 'Description', varName: 'description', group: 'main'})
  public description: string;

  @Property({type: 'boolean', label: 'Active', varName: 'active', required: true, group: 'main'})
  public active: string;

  @Property({type: 'boolean', label: 'Default', varName: 'default', required: true, group: 'main'})
  public default: boolean;

  @Property({type: 'json', label: 'Settings', varName: 'settings', group: 'secondary', schema: settingsSchema})
  public settings: string;

  public static modelConfig: INeo4jModel = {
    select: 'sc:SalesChannel',
    as: 'sc',
    relationships: {}
  };

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'SalesChannel',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'active',
      label: 'Active',
      type: 'boolean',
      model: 'SalesChannel',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'default',
      label: 'Default',
      type: 'boolean',
      model: 'SalesChannel',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  async install() {
    const neo = new BaseNeoService();
    const resConstraints = await neo.neo.readWithCleanUp(`SHOW CONSTRAINTS;`)
    const constraints = resConstraints.map(r => r.labelsOrTypes[0]);
    const found = constraints.filter(c => c.indexOf('SalesChannel') > -1);

    if (found.length > 0) {
      return;
    }

    try {
      await neo.neo.write(`CREATE CONSTRAINT FOR (n:SalesChannel) REQUIRE n.uuid IS UNIQUE;`)
    }
    catch (e) {
      console.log(`COULD NOT CREATE CONSTRAINT FOR SalesChannel`, e);
    }

    try {
      await neo.neo.write(`CALL apoc.uuid.install('SalesChannel');`)
    }
    catch (e) {
      console.log(`COULD NOT install apoc.uuid for SalesChannel`, e);
    }

    try {
      await neo.neo.write(`
            MERGE (n: SalesChannel {slug: 'storefront'})
ON CREATE SET n.title = 'Storefront', n.default = true, n.createdAt = datetime(), n.description = 'Sales channel with HTML storefront'
ON MATCH SET n.updatedAt = datetime()
return n;
`);
    }
    catch (e) {
      console.log(`COULD NOT CREATE DEFAULT SalesChannel`, e);
    }

  }
}
