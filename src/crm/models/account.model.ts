import { McrmModel, Property } from "~neo4j/neo4j.decorators";
import { Injectable } from "@nestjs/common";
import { BaseModel, IBaseModelFieldGroup, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { z } from "zod";
import { BaseNeoService } from "~shared/services/base-neo.service";

const settingsSchema = z.object({
  entryPoint: z.string().optional().describe('json:{"label": "Entry point", "placeholder": "Entry point", "hint": "The entry point for the sales channel", "type": "text"}'),
  urls: z.object({
    url: z.string().optional().describe('json:{"label": "Url", "placeholder": "Url", "hint": "The url for the sales channel", "type": "text"}'),
    previewUrl: z.string().optional().describe('json:{"label": "Preview Url", "placeholder": "Preview Url", "hint": "The preview url for the sales channel", "type": "text"}'),
    currency: z.string().optional().describe('json:{"label": "Currency", "placeholder": "Currency", "hint": "The currency for the sales channel", "type": "text"}'),
    language: z.string().optional().describe('json:{"label": "Language", "placeholder": "Language", "hint": "The language for the sales channel", "type": "text"}'),
  }).optional().describe('json:{"label": "Url Settings", "placeholder": "Url Settings", "hint": "The url settings for the sales channel", "type": "nested", "isReadOnly": true}'),
});

@McrmModel('Account')
@Injectable()
export class AccountModel extends BaseModel {
  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  onApplicationBootstrap() {
    setTimeout(async () => {
      await this.install();
    });
  }

  @Property({type: 'text', label: 'Title', varName: 'title', required: true, group: 'main', isReadOnly: true})
  public title: string;

  @Property({type: 'text', label: 'Slug', varName: 'slug', required: true, isSlug: true, slugFrom: 'title', group: 'hidden', isReadOnly: true})
  public slug;

  @Property({type: 'textarea', label: 'Description', varName: 'description', group: 'main'})
  public description: string;

  @Property({type: 'boolean', label: 'Active', varName: 'active', required: true, group: 'main', isReadOnly: true})
  public active: string;

  @Property({type: 'nested', label: 'Settings', placeholder: 'Settings', varName: 'settings', group: 'secondary', schema: settingsSchema, saveAsJson: true, isReadOnly: true})
  public settings: string;

  public static modelConfig: INeo4jModel = {
    select: 'account:Account',
    as: 'account',
    relationships: {

    }
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [

  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: "title",
      label: "Title",
      type: "text",
      model: "Product",
      filterType: "partial",
      isInSimpleQuery: true
    },
    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Product',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'createdAtFrom',
      rangeToFieldName: 'createdAtTo',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };

  public static fieldGroups: IBaseModelFieldGroup[] = [
    {
      name: "main",
      label: "Main",
      type: "group",
      description: "Main fields",
      fields: ["title",]
    },
    {
      name: 'descriptions',
      label: 'Descriptions',
      type: 'group',
      description: 'Pricing fields',
      fields: ['description', 'description_long'],
    },
    {
      name: 'extra',
      label: 'Extra Fields',
      type: 'group',
      description: 'Extra fields',
    }
  ];

  async install() {
    const neo = new BaseNeoService();
    const resConstraints = await neo.neo.readWithCleanUp(`SHOW CONSTRAINTS;`)
    const constraints = resConstraints.map(r => r.labelsOrTypes[0]);
    const found = constraints.filter(c => c.indexOf('Account') > -1);

    if (found.length > 0) {
      return;
    }

    try {
      await neo.neo.write(`CREATE CONSTRAINT FOR (n:Account) REQUIRE n.uuid IS UNIQUE;`)
    }
    catch (e) {
      console.log(`COULD NOT CREATE CONSTRAINT FOR Account`, e);
    }

    try {
      await neo.neo.write(`CALL apoc.uuid.install('Account');`)
    }
    catch (e) {
      console.log(`COULD NOT install apoc.uuid for Account`, e);
    }

  }
}
