import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IItemSelectorConfig } from "~models/item-selector";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";

const modelName = 'Person';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class PersonModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
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
}
