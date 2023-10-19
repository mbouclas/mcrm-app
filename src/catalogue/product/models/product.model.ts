import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFieldGroup, IBaseModelFilterConfig, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { PropertyService } from '~catalogue/property/services/property.service';
import { OnEvent } from '@nestjs/event-emitter';
import { getStoreProperty, store } from '~root/state';
import { sortBy } from 'lodash';
import { Property } from "~neo4j/neo4j.decorators";

const modelName = 'Product';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ProductModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public title: string;
  public cartCondition: any[];
  public description: string;
  public price = 0;
  public salePrice = 0;
  public slug;
  public sku;
  public uuid: string;



  constructor() {
    super();

    this.loadModelSettingsFromConfig();
  }

  async onModuleInit() {

  }

  public static displayedColumns = ['title', 'category'];


  public static modelConfig: INeo4jModel = {
    select: 'product:Product',
    as: 'product',
    deleteRules: {
      must: [
        {
          type: 'role',
          value: '98',
        },
      ],
    },

    relationships: {
      variants: {
        model: 'ProductVariant',
        modelAlias: 'variants',
        alias: 'productVariantRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_VARIANTS',
      },
      productCategory: {
        model: 'ProductCategory',
        modelAlias: 'productCategory',
        alias: 'productCategoryRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CATEGORY',
        // addRelationshipData: true,
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
      related: {
        rel: 'IS_RELATED_TO',
        alias: 'relatedRelationship',
        model: 'Product',
        modelAlias: 'related',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'title',
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
          // console.log('----', record)
          if (!record.property) {
            return record;
          }

          record.property = await new PropertyService().propertiesWithValuesByModel(
            modelName,
            record.uuid,
            record.property.map((p) => p.uuid),
          );
          return record;
        },
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
      salesChannel: {
        rel: 'BELONGS_TO',
        alias: 'salesChannelRelationship',
        model: 'SalesChannel',
        modelAlias: 'salesChannel',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        postProcessing: async (record: Record<any, any>, model: ProductModel) => {
          if (!record.salesChannel || !Array.isArray(record.salesChannel) || record.salesChannel.length === 0) {
            return record;
          }

          record.salesChannel = record.salesChannel.map((salesChannel) => ({
            ...salesChannel.model,
            ...{
              itemSettings: {
                order: salesChannel.relationship.order || 0,
                visible: salesChannel.relationship.visible || true,
              }
            },
          }));

          record.salesChannel = sortBy(record.salesChannel, 'order');
          return record;
        }
      },
      thumb: {
        rel: 'HAS_IMAGE',
        alias: 'thumbRelationship',
        model: 'Image',
        modelAlias: 'thumb',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        defaultProperty: 'name',
        postProcessing: async (record: Record<any, any>, model: ProductModel) => {
          if (!record.thumb || !Array.isArray(record.thumb) || record.thumb.length === 0) {
            return record;
          }

          record.thumb = record.thumb
            .filter((image) => image.relationship && image.relationship.type === 'main')
            .map((image) => ({
              ...image.model,
              ...{
                type: image.relationship.type,
                order: image.relationship.order,
                title: image.relationship.title,
                description: image.relationship.description,
                alt: image.relationship.alt,
                caption: image.relationship.caption,
              },
            }));

          if (record.thumb.length === 0) {
            record.thumb = record.thumb[0];
          }

          return record;
        },
      },
      images: {
        rel: 'HAS_IMAGE',
        alias: 'imagesRelationship',
        model: 'Image',
        modelAlias: 'images',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        defaultProperty: 'name',
        postProcessing: async (record: Record<any, any>, model: ProductModel) => {
          if (!record.images || !Array.isArray(record.images) || record.images.length === 0) {
            return record;
          }

          record.images = record.images
            .filter((image) => image.relationship && image.relationship.type !== 'main')
            .map((image) => ({
              ...image.model,
              ...{
                type: image.relationship.type,
                order: image.relationship.order,
                title: image.relationship.title,
                description: image.relationship.description,
                alt: image.relationship.alt,
                caption: image.relationship.caption,
              },
            }));

          record.images = sortBy(record.images, 'order');
          return record;
        },
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
      cart: {
        rel: 'HAS_PRODUCTS',
        alias: 'cartRelationship',
        model: 'Cart',
        modelAlias: 'cart',
        type: 'inverse',
        isCollection: true,
        defaultProperty: 'id',
      },
      manufacturer: {
        rel: 'HAS_MANUFACTURER',
        alias: 'manufacturerRelationship',
        model: 'Manufacturer',
        modelAlias: 'manufacturer',
        type: 'normal',
        isCollection: false,
        defaultProperty: 'id',
      },

      cartCondition: {
        rel: 'HAS_CONDITION',
        alias: 'cartConditionRelationship',
        model: 'CartCondition',
        modelAlias: 'cartCondition',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        postProcessing: async (record: Record<any, any>, model: ProductModel) => {
          if (!record.cartCondition || !Array.isArray(record.cartCondition) || record.cartCondition.length === 0) {
            return record;
          }

            record.cartCondition = record.cartCondition
              .map((condition) => ({
                ...condition.model,
                ...{
                  order: condition.relationship.order,
                  rules: JSON.parse(condition.model.rules),
                  attributes: JSON.parse(condition.model.attributes),
                },
              }));

            record.cartCondition = sortBy(record.cartCondition, 'order');
            return record;
        }
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'sku',
      label: 'SKU',
      placeholder: 'SKU',
      type: 'text',
      isSortable: true,
      group: 'right',
      groupIndex: 0,
      isReadOnly: true,
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      isReadOnly: true,
      type: 'boolean',
      isSortable: true,
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'title',
      label: 'Title',
      isReadOnly: true,
      placeholder: 'Title',
      type: 'text',
      isSortable: true,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },

      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'slug',
      label: 'Slug',
      placeholder: 'Slug',
      isReadOnly: true,
      type: 'text',
      group: 'hidden',
      isSlug: true,
      slugFrom: 'title',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      isReadOnly: true,
      type: 'richText',
      isSortable: false,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'description_long',
      label: 'Long Description',
      isReadOnly: true,
      placeholder: 'Long Description',
      type: 'richText',
      isSortable: false,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'price',
      label: 'Price',
      placeholder: 'Price',
      isReadOnly: true,
      type: 'float',
      isSortable: true,
      group: 'right',
      groupIndex: 1,
      searchIndexSettings: {
        isAutoCompleteField: false,
        aggregationFieldSettings: {
          name: 'price',
          type: 'range',
          isKeyword: false,
          size: ProductModel.defaultAggregationSize,
          field: 'price',
          ranges: [
            { to: 60000.0 },
            { from: 60000.0, to: 100000.0 },
            { from: 100000.0, to: 500000.0 },
            { from: 500000.0, to: 1000000.0 },
            { from: 1000000.0 },
          ],
          boost: 2,
        },
      },
      updateRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
        ],
      },
    },
    {
      varName: 'salePrice',
      label: 'Sale Price',
      placeholder: 'Sale Price',
      isReadOnly: true,
      type: 'float',
      isSortable: true,
      group: 'right',
      groupIndex: 2,
      updateRules: {
        must: [
          {
            type: 'role',
            value: 'ADMIN',
          },
        ],
      },
    },
    {
      varName: 'quantity',
      label: 'Quantity',
      placeholder: 'Quantity',
      type: 'number',
      isSortable: true,
      group: 'right',
      groupIndex: 2,
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'thumb',
      label: 'Thumbnail',
      placeholder: 'Thumbnail',
      isReadOnly: true,
      type: 'image',
      imageSettings: {
        multiple: true,
        accept: 'image/*',
        addFromUrl: true,
        selectFromMediaLibrary: true,
        showPreview: true,
        width: 250,
        height: 250,
        defaultCopy: 'thumb',
        maxFileSize: 5000,
        fileLimit: 5,
        quality: 70,
      },
      group: 'right',
      groupIndex: 3,
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'updatedAt',
      label: 'Updated At',
      placeholder: 'Updated At',
      isReadOnly: true,
      type: 'date',
      isSortable: true,
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '2',
          },
        ],
      },
    },
    {
      varName: 'fromImport',
      label: 'fromImport',
      placeholder: 'fromImport',
      type: 'boolean',
      group: 'hidden',
      default: false,
      updateRules: {
        must: [
          {
            type: 'role',
            value: 2,
          },
        ],
      },
    },
    /*{
      varName: 'deliverability',
      label: 'Deliverability',
      placeholder: 'Deliverability',
      type: 'nested',
      group: 'extra',
      default: false,
      fields: [
        {
          varName: 'stock',
          label: 'Stock',
          placeholder: 'Stock',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'clearanceSale',
          label: 'ClearanceSale',
          placeholder: 'ClearanceSale',
          type: 'boolean',
          group: 'hidden',
          default: false,
        },
      ],
    },*/
    {
      varName: 'seo',
      label: 'Seo',
      placeholder: 'Seo',
      type: 'nested',
      group: 'seo',
      default: false,
      fields: [
        {
          varName: 'title',
          label: 'Title',
          placeholder: 'Title',
          type: 'text',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'description',
          label: 'Description',
          placeholder: 'Description',
          type: 'text',
          group: 'hidden',
          default: false,
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
        },
      ],
    },

    /*{
      varName: 'measuresAndPackaging',
      label: 'Measures And Packaging',
      placeholder: 'Measures And Packaging',
      type: 'nested',
      group: 'extra',
      default: false,
      fields: [
        {
          varName: 'width',
          label: 'Width',
          placeholder: 'With',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'height',
          label: 'Height',
          placeholder: 'Height',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'length',
          label: 'Length',
          placeholder: 'Length',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'weight',
          label: 'Weight',
          placeholder: 'Weight',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'sellingUnit',
          label: 'SellingUnit',
          placeholder: 'SellingUnit',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'scaleUnit',
          label: 'ScaleUnit',
          placeholder: 'ScaleUnit',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'packagingUnit',
          label: 'PackagingUnit',
          placeholder: 'PackagingUnit',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'basicUnit',
          label: 'BasicUnit',
          placeholder: 'BasicUnit',
          type: 'number',
          group: 'hidden',
          default: false,
        },
      ],
    },*/
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'title',
      label: 'Title',
      type: 'text',
      model: 'Product',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'sku',
      label: 'SKU',
      type: 'text',
      model: 'Product',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'active',
      label: 'Active',
      type: 'boolean',
      model: 'Product',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'price',
      label: 'Price',
      type: 'number',
      model: 'Product',
      isRange: true,
      rangeFromFieldName: 'priceFrom',
      rangeToFieldName: 'priceTo',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'productCategory',
      filterField: 'uuid',
      label: 'Category',
      type: 'string',
      relName: 'categoriesFilterRel',
      relType: 'inverse',
      model: 'ProductCategory',
      filterType: 'exact',
      isInSimpleQuery: false,
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
    {
      varName: 'salesChannel',
      filterField: 'uuid',
      label: 'Sales Channel',
      type: 'string',
      relName: 'salesChannelFilterRel',
      relType: 'inverse',
      model: 'SalesChannel',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };

  public static fieldGroups: IBaseModelFieldGroup[] = [
    {
      name: 'main',
      label: 'Main',
      type: 'group',
      description: 'Main fields',
    },
    {
      name: 'right',
      label: 'Right',
      type: 'group',
      description: 'Right fields',
    },
    {
      name: 'seo',
      label: 'Seo',
      type: 'group',
      description: 'Seo fields',
    },
    {
      name: 'extra',
      label: 'Extra Fields',
      type: 'group',
      description: 'Extra fields',
    }
  ];

}
