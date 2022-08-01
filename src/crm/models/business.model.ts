import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IItemSelectorConfig } from "~models/item-selector";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";

const modelName = 'Business';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class BusinessModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
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
      varName: 'updatedAt',
      label: 'Updated At',
      placeholder: 'Updated At',
      type: 'date',
      isSortable: true,
      group: 'hidden',
    },
    {
      varName: 'verifiedAt',
      label: 'Verified At',
      placeholder: 'Verified At',
      type: 'date',
      isSortable: true,
      group: 'hidden',
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
}
