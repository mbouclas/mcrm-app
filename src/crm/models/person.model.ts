import { BaseModel, IBaseModelFieldGroup, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { McrmModel, Property } from "~neo4j/neo4j.decorators";
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

@McrmModel('Person')
@Injectable()
export class PersonModel extends BaseModel {
  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  onApplicationBootstrap() {
    setTimeout(async () => {
      await this.install();
    });
  }

  @Property({type: 'text', label: 'First Name', varName: 'firstName', required: true, group: 'main', isReadOnly: true})
  public firstName: string;

  @Property({type: 'text', label: 'Last Name', varName: 'lastName', required: true, group: 'main', isReadOnly: true})
  public lastName: string;

  @Property({type: 'boolean', label: 'Active', varName: 'active', required: true, group: 'main', isReadOnly: true})
  public active: string;

  @Property({type: 'nested', label: 'Settings', placeholder: 'Settings', varName: 'settings', group: 'secondary', schema: settingsSchema, saveAsJson: true, isReadOnly: true})
  public settings: string;


  public static modelConfig: INeo4jModel = {
    select: 'person:Person',
    as: 'person',
    relationships: {
      postCode: {
        rel: 'HAS_POSTCODE',
        alias: 'postCodeRelationship',
        model: 'PostCode',
        modelAlias: 'postCode',
        type: 'normal',
        isCollection: false,
        isSortable: true,
        orderByKey: 'code',
        defaultProperty: 'code',
      },
      issue: {
        rel: 'HAS_ISSUE',
        alias: 'issueRelationship',
        model: 'Issue',
        modelAlias: 'issue',
        type: 'normal',
        defaultProperty: 'issue',
        isCollection: false,
      },
      issueCount: {
        rel: 'HAS_ISSUE',
        alias: 'issueCountRelationship',
        model: 'Issue',
        modelAlias: 'issueCount',
        type: 'normal',
        isCount: true,
        isCollection: false,
        isSortable: true,
      },
      issues: {
        rel: 'HAS_ISSUE',
        alias: 'issuesRelationship',
        model: 'Issue',
        modelAlias: 'issues',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'issue',
      },
      worksAt: {
        rel: 'WORKS_AT',
        alias: 'worksAtRelationship',
        model: 'Business',
        modelAlias: 'worksAt',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      business: {
        rel: 'WORKS_AT',
        alias: 'worksAtRelationship',
        model: 'Business',
        modelAlias: 'worksAt',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      isOwner: {
        rel: 'IS_OWNER',
        alias: 'isOwnerRelationship',
        model: 'Business',
        modelAlias: 'isOwner',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      owner: {
        rel: 'IS_OWNER',
        alias: 'isOwnerRelationship',
        model: 'Business',
        modelAlias: 'isOwner',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      businessRole: {
        rel: 'HAS_BUSINESS_ROLE',
        alias: 'businessRoleRelationship',
        model: 'BusinessRole',
        modelAlias: 'businessRole',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      personClassification: {
        rel: 'HAS_CLASSIFICATION',
        alias: 'personClassificationRelationship',
        model: 'PersonClassification',
        modelAlias: 'personClassification',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      city: {
        rel: 'HAS_CITY',
        alias: 'cityRelationship',
        model: 'City',
        modelAlias: 'city',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'name',
      },
      municipality: {
        rel: 'HAS_MUNICIPALITY',
        alias: 'municipalityRelationship',
        model: 'City',
        modelAlias: 'municipality',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'name',
      },
      street: {
        rel: 'HAS_STREET',
        alias: 'streetRelationship',
        model: 'City',
        modelAlias: 'street',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'name',
      },
      tag: {
        rel: 'HAS_TAGS',
        alias: 'tagRelationship',
        model: 'Tag',
        modelAlias: 'tag',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
    }
  };
  public static fields: IDynamicFieldConfigBlueprint[] = [

  ];
  public static filterFields: IQueryBuilderFieldBlueprint[] = [
/*    {
      "varName": "email",
      "placeholder": "Email",
      "label": "First Email",
      "type": "text",
      "relName": "",
      "isInSimpleQuery": true,
      filterType: 'partial',
      "model": "User",
      "filterField": "",
      "order": 0
    },
    {
      "varName": "firstName",
      "placeholder": "Name",
      "label": "First Name",
      "type": "text",
      "relName": "",
      "isInSimpleQuery": true,
      "model": "User",
      "filterField": "",
      "order": 1
    },
    {
      "varName": "lastName",
      "placeholder": "Surname",
      "label": "Surname",
      "type": "text",
      "relName": "",
      "isInSimpleQuery": true,
      "model": "User",
      "filterField": "",
      "order": 2
    },*/
  ];
  //public static itemSelector: IItemSelectorConfig = {};

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
    const found = constraints.filter(c => c.indexOf('Person') > -1);

    if (found.length > 0) {
      return;
    }

    try {
      await neo.neo.write(`CREATE CONSTRAINT FOR (n:Person) REQUIRE n.uuid IS UNIQUE;`)
    }
    catch (e) {
      console.log(`COULD NOT CREATE CONSTRAINT FOR Person`, e);
    }

    try {
      await neo.neo.write(`CALL apoc.uuid.install('Person');`)
    }
    catch (e) {
      console.log(`COULD NOT install apoc.uuid for Person`, e);
    }

  }
}
