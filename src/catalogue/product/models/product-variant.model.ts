import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { BaseModel, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { PropertyService } from '~catalogue/property/services/property.service';

const modelName = 'ProductVariant';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class ProductVariantModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;

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
      images: {
        rel: 'HAS_IMAGE',
        alias: 'imagesRelationship',
        model: 'Image',
        modelAlias: 'images',
        type: 'normal',
        isCollection: true,
        defaultProperty: 'name',
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
      varName: 'active',
      label: 'Active',
      placeholder: 'Active',
      type: 'boolean',
      translatable: true,
      group: 'main',
    },
    {
      varName: 'name',
      label: 'Name',
      placeholder: 'Name',
      type: 'text',
      translatable: true,
      required: true,
      setDefaultTranslationInModel: true,
      group: 'main',
    },
    {
      varName: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
      translatable: true,
      group: 'main',
    },
    {
      varName: 'price',
      label: 'Price',
      placeholder: 'Price',
      type: 'number',
      translatable: true,
      group: 'main',
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
  ];
}
