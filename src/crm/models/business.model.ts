import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IItemSelectorConfig } from "~models/item-selector";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { McrmModel, Property } from "~neo4j/neo4j.decorators";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { z } from "zod";

const settingsSchema = z.object({
  entryPoint: z.string().optional().describe('json:{"label": "Entry point", "placeholder": "Entry point", "hint": "The entry point for the sales channel", "type": "text"}'),
  urls: z.object({
    url: z.string().optional().describe('json:{"label": "Url", "placeholder": "Url", "hint": "The url for the sales channel", "type": "text"}'),
    previewUrl: z.string().optional().describe('json:{"label": "Preview Url", "placeholder": "Preview Url", "hint": "The preview url for the sales channel", "type": "text"}'),
    currency: z.string().optional().describe('json:{"label": "Currency", "placeholder": "Currency", "hint": "The currency for the sales channel", "type": "text"}'),
    language: z.string().optional().describe('json:{"label": "Language", "placeholder": "Language", "hint": "The language for the sales channel", "type": "text"}'),
  }).optional().describe('json:{"label": "Url Settings", "placeholder": "Url Settings", "hint": "The url settings for the sales channel", "type": "nested", "isReadOnly": true}'),
});

@McrmModel('Business')
@Injectable()
export class BusinessModel extends BaseModel {
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

  @Property({type: 'nested', label: 'Settings', placeholder: 'Settings', varName: 'settings', group: 'secondary', schema: settingsSchema, saveAsJson: true, isReadOnly: true})
  public settings: string;

  @Property({type: 'textarea', label: 'Description', varName: 'description', group: 'main'})
  public description: string;

  @Property({type: 'boolean', label: 'Active', varName: 'active', required: true, group: 'main', isReadOnly: true})
  public active: string;

  public static displayedColumns =  ['firstName','lastName','mobile', 'email','issueCount', 'postCode'];

  public static modelConfig: INeo4jModel = {
    select: 'business:Business',
    as: 'business',
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
      businessType: {
        rel: 'BUSINESS_HAS_TYPE',
        alias: 'businessTypeRelationship',
        model: 'BusinessType',
        modelAlias: 'businessType',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        isTree: true,
        isMultilingual: true,
        defaultProperty: 'name',
      },
      categoryFilter: {
        rel: 'BUSINESS_HAS_TYPE',
        alias: 'categoryFilterRelationship',
        model: 'BusinessType',
        modelAlias: 'categoryFilter',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      businessChildren: {
        rel: 'HAS_CHILD',
        alias: 'businessChildrenRelationship',
        model: 'Business',
        modelAlias: 'businessChildren',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      businessParent: {
        rel: 'HAS_PARENT',
        alias: 'businessParentRelationship',
        model: 'Business',
        modelAlias: 'businessParent',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      owner: {
        rel: 'IS_OWNER',
        alias: 'ownerRelationship',
        model: 'Person',
        modelAlias: 'owner',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
      },
      employee: {
        rel: 'WORKS_AT',
        alias: 'employeeRelationship',
        model: 'Person',
        modelAlias: 'employee',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
      },
      people: {
        rel: 'WORKS_AT',
        alias: 'peopleRelationship',
        model: 'Person',
        modelAlias: 'people',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
      },
      peopleCount: {
        rel: 'WORKS_AT',
        alias: 'peopleCountRelationship',
        model: 'Person',
        modelAlias: 'peopleCount',
        type: 'inverse',
        isCount: true,
        isCollection: false,
        isSortable: true,
      },
      issueCount: {
        rel: 'HAS_ISSUE',
        alias: 'issueCountRelationship',
        model: 'Issue',
        modelAlias: 'issueCount',
        type: 'inverse',
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
        model: 'Municipality',
        modelAlias: 'municipality',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'name',
      },
      street: {
        rel: 'HAS_STREET',
        alias: 'streetRelationship',
        model: 'Street',
        modelAlias: 'street',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'name',
      },
      tags: {
        rel: 'HAS_TAGS',
        alias: 'tagRelationship',
        model: 'Tag',
        modelAlias: 'tag',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        sortableCountDefaultAlias: 'tag',
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
      tagCount: {
        rel: 'HAS_TAGS',
        alias: 'tagCountRelationship',
        model: 'Tag',
        modelAlias: 'tagCount',
        type: 'normal',
        isCollection: false,
        isCount: true,
      },
      extraField: {
        rel: 'HAS_EXTRA_FIELD',
        alias: 'tagRelationship',
        model: 'ExtraField',
        modelAlias: 'extraField',
        type: 'normal',
        isCollection: true,
      },
      creator: {
        rel: 'HAS_CREATED',
        alias: 'creatorRelationship',
        model: 'User',
        modelAlias: 'creator',
        type: 'inverse',
        isCollection: false,
        defaultProperty: 'firstName.lastName',
      },
      editor: {
        rel: 'HAS_EDITED',
        alias: 'editorRelationship',
        model: 'User',
        modelAlias: 'editor',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
        addRelationshipData: true,
      },
    }
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'thumb',
      label: 'Thumbnail',
      placeholder: 'Thumbnail',
      type: 'image',
      group: 'right',
    },
    {
      varName: 'seo',
      label: 'Seo',
      placeholder: 'Seo',
      type: 'nested',
      group: 'seo',
      saveAsJson: true,
      fields: [
        {
          varName: 'title',
          label: 'Title',
          placeholder: 'Title',
          type: 'text',
          group: 'hidden',
          default: false,
          settings: {bindTo: 'title'},
        },
        {
          varName: 'description',
          label: 'Description',
          placeholder: 'Description',
          type: 'text',
          group: 'hidden',
          default: false,
          settings: {bindTo: 'description'},
        },
        {
          varName: 'keywords',
          label: 'Keywords',
          placeholder: 'Keywords',
          type: 'text',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'og_title',
          label: 'Og:Title',
          placeholder: 'Oh:Title',
          type: 'text',
          group: 'hidden',
          default: false,
          settings: {bindTo: 'title'},
        },
        {
          varName: 'og_image',
          label: 'Og:Image',
          placeholder: 'Og:Image',
          type: 'text',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'og_description',
          label: 'Og:Description',
          placeholder: 'Og:Description',
          type: 'text',
          group: 'hidden',
          default: false,
          settings: {bindTo: 'description'},
        },
      ],
    },
  ];
  public static filterFields: IQueryBuilderFieldBlueprint[] = [];
  public static itemSelector: IItemSelectorConfig = {
    module: 'crm',
    varName: 'business',
    slice: 'business',
    label: 'People',
    priority: 10,
    tabs: [
      {
        varName: 'items',
        label: 'People',
        provider: '',
        url: 'crm/admin/itemSelector/business',
        filterFields: () => {return BusinessModel.filterFields},
        config: {
          filterParamName: 'q',
          minNumberOfCharacterForSearch: 3
        }
      },
    ]
  };

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };

  async install() {
    const neo = new BaseNeoService();
    const resConstraints = await neo.neo.readWithCleanUp(`SHOW CONSTRAINTS;`)
    const constraints = resConstraints.map(r => r.labelsOrTypes[0]);
    const found = constraints.filter(c => c.indexOf('Business') > -1);

    if (found.length > 0) {
      return;
    }

    try {
      await neo.neo.write(`CREATE CONSTRAINT FOR (n:Business) REQUIRE n.uuid IS UNIQUE;`)
    }
    catch (e) {
      console.log(`COULD NOT CREATE CONSTRAINT FOR Business`, e);
    }

    try {
      await neo.neo.write(`CALL apoc.uuid.install('Business');`)
    }
    catch (e) {
      console.log(`COULD NOT install apoc.uuid for Business`, e);
    }

  }
}
