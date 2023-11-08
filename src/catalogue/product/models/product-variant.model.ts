import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { BaseModel, IBaseModelFieldGroup, INeo4jModel } from "~models/base.model";
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { PropertyService } from '~catalogue/property/services/property.service';
import { IQueryBuilderFieldBlueprint } from '~root/shared/models/queryBuilder';
import { Property } from "~neo4j/neo4j.decorators";
import { IBaseImageCopy } from "~image/models/image.types";
import { sortBy } from "lodash";

const modelName = 'ProductVariant';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ProductVariantModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public sku: string;
  public variantId: string;
  public thumb: IBaseImageCopy


  public static modelConfig: INeo4jModel = {
    select: 'productVariant:ProductVariant',
    as: 'productVariant',
    relationships: {
      product: {
        rel: 'HAS_VARIANTS',
        alias: 'productVariantRelationship',
        model: 'Product',
        modelAlias: 'product',
        type: 'inverse',
        isCollection: true,
      },
      thumb: {
        rel: 'HAS_IMAGE',
        alias: 'thumbRelationship',
        model: 'Image',
        modelAlias: 'thumbRel',
        type: 'normal',
        isCollection: true,
        addRelationshipData: true,
        defaultProperty: 'name',
        postProcessing: async (record: Record<any, any>, model: ProductVariantModel) => {
          if (typeof record.thumb === 'object' && !Array.isArray(record.thumb)) {
            return record;
          }

          if (!record.thumb && Array.isArray(record.thumbRel) && record.thumbRel.length > 0) {
            record.thumb = {};
          }

          if (!Array.isArray(record.thumbRel) || record.thumbRel.length === 0) {
            record.thumbRel = [];
          }


          record.thumb = record.thumbRel
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

          if (Array.isArray(record.thumb) && record.thumb.length > 0) {
            record.thumb = record.thumb[0];
            delete record.thumbRel;
            return record
          }

          if (!record.thumb || !Array.isArray(record.thumbRel) || record.thumbRel.length === 0) {
            record.thumb = {};
            return record;
          }

          // legacy support for string thumbs
          if (record.thumb && typeof record.thumb === 'string' && record.thumb.indexOf('{"url":') === -1) {
            record.thumb = {url: record.thumb};
            return record;
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
        postProcessing: async (record: Record<any, any>, model: ProductVariantModel) => {
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
        postProcessing: async (record: Record<any, any>, model: ProductVariantModel) => {
          if (record.property) {
            record.property = await new PropertyService().propertiesWithValuesByModel(
              modelName,
              record.uuid,
              record.property.map((p) => p.uuid),
            );
          }

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
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'text',
      required: true,
      group: 'main',
      disabled: true,
    },
    {
      varName: 'title',
      label: 'Title',
      placeholder: 'Title',
      type: 'text',
      required: true,
      group: 'main',
    },
    {
      varName: 'price',
      label: 'Price',
      placeholder: 'Price',
      type: 'number',
      group: 'main',
    },
    {
      varName: 'salePrice',
      label: 'Sale Price',
      placeholder: 'Sale Price',
      isReadOnly: true,
      type: 'float',
      isSortable: true,
    },
    {
      varName: 'thumb',
      label: 'Thumbnail',
      placeholder: 'Thumbnail',
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
      varName: 'variantId',
      label: 'VariantId',
      placeholder: 'VariantId',
      type: 'text',
      group: 'main',
      disabled: true,
    },

    {
      varName: 'sku',
      label: 'Sku',
      placeholder: 'Sku',
      type: 'text',
      disabled: true,
      group: 'main',
    },

    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      isReadOnly: true,
      type: 'markdown',
      isSortable: false,
      group: 'main',
      hint: 'Short description of the product',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
    },
    {
      varName: 'description_long',
      label: 'Long Description',
      isReadOnly: true,
      placeholder: 'Long Description',
      type: 'markdown',
      hint: 'Full description of the product',
      isSortable: false,
      group: 'main',
      searchIndexSettings: {
        isAutoCompleteField: true,
      },
    },
    {
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      type: 'boolean',
      group: 'main',
    },
    {
      varName: 'cost',
      label: 'Cost',
      placeholder: 'Cost',
      isReadOnly: true,
      type: 'float',
      isSortable: true,
      hint: 'Cost of the product',
    },
    {
      varName: 'stock',
      label: 'Stock',
      placeholder: 'Stock',
      type: 'number',
      isSortable: true,
      group: 'right',
      groupIndex: 2,
      isReadOnly: true,
    },
    {
      varName: 'lowStock',
      label: 'Low Stock',
      placeholder: 'Low Stock',
      type: 'number',
      isSortable: true,
      group: 'right',
      groupIndex: 2,
      isReadOnly: true,
    },
    {
      varName: 'trackInventory',
      label: 'Track Inventory',
      placeholder: 'Track Inventory',
      type: 'boolean',
      isSortable: false,
      default: true,
      groupIndex: 2,
      isReadOnly: true,
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
    {
      varName: 'fulfillment',
      label: 'Measures And Packaging',
      placeholder: 'Measures And Packaging',
      type: 'nested',
      group: 'extra',
      saveAsJson: true,
      fields: [
        {
          varName: 'width',
          label: 'Width',
          placeholder: 'With',
          type: 'number',
          default: false,
        },
        {
          varName: 'height',
          label: 'Height',
          placeholder: 'Height',
          type: 'number',
          default: false,
        },
        {
          varName: 'length',
          label: 'Length',
          placeholder: 'Length',
          type: 'number',
          default: false,
        },
        {
          varName: 'weight',
          label: 'Weight',
          placeholder: 'Weight',
          type: 'number',
          default: false,
        },
        {
          varName: 'sellingUnit',
          label: 'Selling Unit',
          placeholder: 'Selling Unit',
          type: 'number',
          default: false,
        },
        {
          varName: 'scaleUnit',
          label: 'Scale Unit',
          placeholder: 'Scale Unit',
          type: 'number',
          group: 'hidden',
          default: false,
        },
        {
          varName: 'packagingUnit',
          label: 'Packaging Unit',
          placeholder: 'Packaging Unit',
          type: 'number',
          default: false,
        },
        {
          varName: 'baseUnit',
          label: 'Base Unit',
          placeholder: 'Base Unit',
          type: 'number',
          default: false,
        },
      ],
    },
    {
      varName: 'shippingDetails',
      label: 'Shipping Details',
      placeholder: 'Shipping Details',
      type: 'nested',
      group: 'shippingDetails',
      saveAsJson: true,
      fields: [
        {
          varName: 'fixedShippingPrice',
          label: 'Fixed Shipping Price',
          placeholder: 'Fixed Shipping Price',
          type: 'number',
        },
        {
          varName: 'freeShipping',
          label: 'Free Shipping',
          placeholder: 'Free Shipping',
          type: 'boolean',
          default: false,
        }
      ],
    },
    {
      varName: 'storefront',
      label: 'Storefront',
      placeholder: 'Storefront',
      type: 'nested',
      group: 'storefront',
      saveAsJson: true,
      fields: [
        {
          varName: 'searchKeywords',
          label: 'Search Keywords',
          placeholder: 'Search Keywords',
          type: 'text',
        },
        {
          varName: 'warrantyInfo',
          label: 'Warranty Info',
          placeholder: 'Warranty Info',
          type: 'markdown',
        },
        {
          varName: 'availabilityText',
          label: 'Availability Text',
          placeholder: 'Availability Text',
          type: 'markdown',
          hint: 'A few words telling the customer how long it will take to ship this product. For example: "Ships in 1-2 business days."',
        },
        {
          varName: 'condition',
          label: 'Condition',
          placeholder: 'Condition',
          type: 'select',
          options: [
            {
              label: 'New',
              value: 'new',
              default: true,
            },
            {
              label: 'Used',
              value: 'used',
            },
            {
              label: 'Refurbished',
              value: 'refurbished',
            },
            {
              label: 'Open Box',
              value: 'openBox',
            },
          ],
        },
        {
          varName: 'showConditionOnStorefront',
          label: 'Show Condition on storefront',
          placeholder: 'Show Condition on storefront',
          type: 'boolean',
          default: false,
        },
      ]
    },
    {
      varName: 'purchasability',
      label: 'Purchasability',
      placeholder: 'Purchasability',
      type: 'nested',
      group: 'purchasability',
      saveAsJson: true,
      fields: [
        {
          varName: 'purchasability',
          label: 'Purchasability',
          placeholder: 'Purchasability',
          type: 'radio',
          options: [
            {
              label: 'This product can be purchased in my online store',
              value: 'online',
              default: true,
            },
            {
              label: 'This product is coming soon but I want to take pre-orders',
              value: 'preorders',
              default: false,
            },
            {
              label: 'This product cannot be purchased in my online store',
              value: 'offline',
              default: false,
            },
          ]
        },
        {
          varName: 'minimumPurchaseQuantity',
          label: 'Minimum Purchase Quantity',
          placeholder: 'Minimum Purchase Quantity',
          type: 'number',
        },
        {
          varName: 'maximumPurchaseQuantity',
          label: 'Maximum Purchase Quantity',
          placeholder: 'Maximum Purchase Quantity',
          type: 'number',
        },
      ],
    }
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'product',
      filterField: 'uuid',
      label: 'Product',
      type: 'string',
      relName: 'productFilterRel',
      relType: 'inverse',
      model: 'Product',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'sku',
      label: 'SKU',
      type: 'text',
      model: 'ProductVariant',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'variantId',
      label: 'Variant ID',
      type: 'text',
      model: 'ProductVariant',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'name',
      label: 'Variant Name',
      type: 'text',
      model: 'ProductVariant',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'title',
      label: 'Variant Title',
      type: 'text',
      model: 'ProductVariant',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
  ];

  public static fieldGroups: IBaseModelFieldGroup[] = [
    {
      name: 'main',
      label: 'Main',
      type: 'group',
      description: 'Main fields',
      fields: ['title','name', 'sku', 'variantId'],
    },
    {
      name: 'descriptions',
      label: 'Descriptions',
      type: 'group',
      description: 'Pricing fields',
      fields: ['description', 'description_long'],
    },
    {
      name: 'pricing',
      label: 'Pricing',
      type: 'group',
      description: 'Pricing fields',
      fields: ['price', 'salePrice', 'cost'],
    },
    {
      name: 'inventory',
      label: 'Inventory',
      type: 'group',
      description: 'Inventory fields',
      fields: ['stock', 'lowStock', 'trackInventory'],
    },
    {
      name: 'seo',
      label: 'Seo',
      type: 'group',
      description: 'Seo fields',
      fields: ['seo'],
    },
    {
      name: 'fulfillment',
      label: 'Fulfillment',
      type: 'group',
      description: 'Fulfillment fields',
      fields: ['fulfillment'],
    },
    {
      name: 'storefront',
      label: 'Storefront',
      type: 'group',
      description: 'Storefront fields',
      fields: ['storefront'],
    },
    {
      name: 'purchasability',
      label: 'Purchasability',
      type: 'group',
      description: 'Purchasability fields',
      fields: ['purchasability'],
    },
    {
      name: 'shippingDetails',
      label: 'Shipping Details',
      type: 'group',
      description: 'Shipping Details fields',
      fields: ['shippingDetails'],
    },
    {
      name: 'extra',
      label: 'Extra Fields',
      type: 'group',
      description: 'Extra fields',
    }
  ];

}
