import { Injectable, OnModuleInit } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from "~admin/models/dynamicFields";
import { IQueryBuilderFieldBlueprint } from "~shared/models/queryBuilder";
import { PropertyService } from "~catalogue/property/property.service";

const modelName = 'Product';
@McmsDi({
  id: modelName,
  type: 'model'
})
@Injectable()
export class ProductModel extends BaseModel implements OnModuleInit
{
  public modelName = modelName;
  public static modelName = modelName;


  async onModuleInit() {

  }

  public static displayedColumns =  ['title','category'];

  public static modelConfig: INeo4jModel = {
    select: 'product:Product',
    as: 'product',
    relationships: {
      category: {
        model: 'ProductCategory',
        modelAlias: 'productCategory',
        alias: 'productCategoryRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CATEGORY'
      },
      categoryFilter: {
        rel: 'HAS_CATEGORY',
        alias: 'categoryFilterRelationship',
        model: 'productCategory',
        modelAlias: 'categoryFilter',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
      },
      owner: {
        rel: 'IS_OWNER',
        alias: 'ownerRelationship',
        model: 'User',
        modelAlias: 'owner',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'firstName.lastName',
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
      properties: {
        rel: 'HAS_PROPERTY',
        alias: 'propertyRelationship',
        model: 'Property',
        modelAlias: 'property',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        sortableCountDefaultAlias: 'property',
        defaultProperty: 'title',
        postProcessing: async (record: Record<any, any>, model: ProductModel) => {
          if (record.property) {
            record.property = await (new PropertyService).propertiesWithValuesByModel(modelName, record.uuid, record.property.map(p => p.uuid));
          }

          return record;
        }
      },
      propertyValues: {
        rel: 'HAS_PROPERTY_VALUE',
        alias: 'propertyValueRelationship',
        model: 'PropertyValue',
        modelAlias: 'propertyValue',
        type: 'normal',
        isCollection: true,
        isSortableCount: true,
        sortableCountDefaultAlias: 'propertyValue',
        defaultProperty: 'name',
      },
      extraField: {
        rel: 'HAS_EXTRA_FIELD',
        alias: 'extraFieldRelationship',
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

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC'
  };
}
