import { Injectable, OnModuleInit } from '@nestjs/common';
import { McmsDi } from '~helpers/mcms-component.decorator';
import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { PaymentMethodModel } from '../../payment-method/models/payment-method.model';
import { ShippingMethodModel } from '../../shipping-method/models/shipping-method.model';
import { AddressModel } from '~root/eshop/address/models/address.model';
import { CartModel } from '~eshop/models/Cart.model';
import { ProductService } from '~catalogue/product/services/product.service';
import { ProductVariantService } from '~catalogue/product/services/product-variant.service';
import { AddressService } from '~eshop/address/services/address.service';

const modelName = 'Order';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class OrderModel extends BaseModel implements OnModuleInit {
  public modelName = modelName;
  public static modelName = modelName;
  public static defaultAggregationSize = 30;
  public orderId: string;
  public userId: string;
  public uuid: string;
  public paymentInfo: string;
  public shippingInfo: string;

  async onModuleInit() { }

  public static displayedColumns = [];

  public static modelConfig: INeo4jModel = {
    select: 'order:Order',
    as: 'order',
    deleteRules: {
      must: [
        {
          type: 'role',
          value: '98',
        },
      ],
    },
    relationships: {
      product: {
        model: 'Product',
        modelAlias: 'product',
        alias: 'productRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ITEM',
        exactAliasQuery: true,
      },
      variant: {
        model: 'ProductVariant',
        modelAlias: 'variant',
        alias: 'productVariantRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ITEM',
        exactAliasQuery: true,
      },

      user: {
        model: 'User',
        modelAlias: 'user',
        alias: 'userRelationship',
        type: 'inverse',
        isCollection: false,
        rel: 'HAS_CREATED',
        filters: {
          allowMultiple: true,
          type: 'inverse',
          allowedFields: ['uuid', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt', 'updatedAt'],
        },
      },

      cart: {
        model: 'Cart',
        modelAlias: 'cart',
        alias: 'cartRelationship',
        type: 'normal',
        isCollection: false,
        rel: 'HAS_CART',
        exactAliasQuery: true,
        postProcessing: async (record: Record<any, any>, model: OrderModel) => {
          if (!record || !record.cart) {
            return record;
          }

          if (!Array.isArray(record.cart.items)) {
            return record;
          }

          const products = await new ProductService().find({ uuids: record.cart.items.map((item) => item.productId) });
          record.cart.items.forEach((item) => {
            item.product = products.data.find((product) => product['uuid'] === item.productId);
          });

          const variants = await new ProductVariantService().find({
            uuids: record.cart.items.map((item) => item.variantId),
          });
          record.cart.items.forEach((item) => {
            item.variant = variants.data.find((product) => product['uuid'] === item.variantId);
          });

          return record;
        },
      },

      paymentMethod: {
        model: 'PaymentMethod',
        modelAlias: 'paymentMethod',
        alias: 'paymentMethodRelationship',
        type: 'normal',
        isCollection: false,
        rel: 'HAS_PAYMENT_METHOD',
        tabs: ['General'],
        group: 'right',
        fields: PaymentMethodModel.fields.map((field) => ({
          ...field,
          updateRules: {
            must: [
              {
                type: 'role',
                value: '98',
              },
              {
                type: 'field',
                value: 'status=0',
              },
            ],
          },
        })),
      },

      shippingMethod: {
        model: 'ShippingMethod',
        modelAlias: 'shippingMethod',
        alias: 'shippingMethodRelationship',
        type: 'normal',
        isCollection: false,
        rel: 'HAS_SHIPPING_METHOD',
        tabs: ['General'],
        group: 'right',
        fields: ShippingMethodModel.fields.map((field) => ({
          ...field,
          updateRules: {
            must: [
              {
                type: 'role',
                value: '98',
              },
              {
                type: 'field',
                value: 'status=0',
              },
            ],
          },
        })),
      },
      address: {
        model: 'Address',
        modelAlias: 'address',
        alias: 'addressRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ADDRESS',
        tabs: ['General'],
        fields: AddressModel.fields.map((field) => ({
          ...field,
          updateRules: {
            must: [
              {
                type: 'role',
                value: '98',
              },
              {
                type: 'field',
                value: 'status=0',
              },
            ],
          },
        })),
        postProcessing: async (record: Record<any, any>, model: OrderModel) => {
          if (!Array.isArray(record.address)) {
            return record;
          }
          // get the type of the address
          for (const address of record.address) {
            const type = await new AddressService().getAddressType({ uuid: address.uuid }, 'Order', {
              uuid: record.uuid,
            });

            // Same address can be used for billing and shipping
            if (type.length > 1 && record.address.length === 1) {
              address.type = ['BILLING', 'SHIPPING'];
            } else if (type.length === 1) {
              address.type = [type[0].type];
            }
          }

          return record;
        },
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'orderId',
      label: 'OrderId',
      placeholder: 'OrderId',
      type: 'text',
      isSortable: true,
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'userId',
      label: 'UserId',
      placeholder: 'UserId',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'total',
      label: 'Total',
      placeholder: 'Total',
      type: 'number',
      isSortable: true,
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'metaData',
      label: 'Meta Data',
      placeholder: 'Meta Data',
      type: 'json',
      isSortable: false,
      group: 'hidden',
    },
    {
      varName: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'number',
      ui: {
        component: 'DropDown',
        defaultValues: [0, 1, 2, 3, 4, 5],
      },
      isSortable: true,
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
        ],
      },
    },
    {
      varName: 'paymentStatus',
      label: 'PaymentStatus',
      placeholder: 'PaymentStatus',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingStatus',
      label: 'ShippingStatus',
      placeholder: 'ShippingStatus',
      type: 'number',
      isSortable: true,
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'VAT',
      label: 'VAT',
      placeholder: 'VAT',
      type: 'number',
      isSortable: true,
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingMethod',
      label: 'ShippingMethod',
      placeholder: 'ShippingMethod',
      type: 'text',
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'paymentMethod',
      label: 'PaymentMethod',
      placeholder: 'PaymentMethod',
      type: 'text',
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'notes',
      label: 'Notes',
      placeholder: 'Notes',
      type: 'text',
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'salesChannel',
      label: 'SalesChannel',
      placeholder: 'SalesChannel',
      type: 'text',
      group: 'main',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'billingAddressId',
      label: 'BillingAddressId',
      placeholder: 'BillingAddressId',
      type: 'text',
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingAddressId',
      label: 'ShippingAddressId',
      placeholder: 'ShippingAddressId',
      type: 'text',
      group: 'hidden',
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'paymentInfo',
      label: 'PaymentInfo',
      placeholder: 'PaymentInfo',
      type: 'json',
      group: 'main',
      fields: [
        {
          varName: 'provider',
          label: 'Provider',
          placeholder: 'Provider',
          type: 'text',
          group: 'main',
          default: false,
        },
        {
          varName: 'price',
          label: 'Price',
          placeholder: 'Price',
          type: 'number',
          group: 'main',
          default: false,
        },
      ],
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
    {
      varName: 'shippingInfo',
      label: 'ShippingInfo',
      placeholder: 'ShippingInfo',
      type: 'json',
      group: 'main',
      fields: [
        {
          varName: 'status',
          label: 'Status',
          placeholder: 'Status',
          type: 'text',
          group: 'main',
          default: false,
        },
      ],
      updateRules: {
        must: [
          {
            type: 'role',
            value: '98',
          },
          {
            type: 'field',
            value: 'status=0',
          },
        ],
      },
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'userId',
      label: 'UserId',
      type: 'text',
      model: 'Order',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'status',
      label: 'Status',
      type: 'number',
      model: 'Order',
      filterType: 'exact',
      isInSimpleQuery: true,
    },
    {
      varName: 'total',
      label: 'Price',
      type: 'number',
      model: 'Order',
      isRange: true,
      rangeFromFieldName: 'priceFrom',
      rangeToFieldName: 'priceTo',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Order',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'createdAtFrom',
      rangeToFieldName: 'createdAtTo',
      isInSimpleQuery: false,
    },
    {
      varName: 'orderId',
      label: 'Order ID',
      type: 'string',
      model: 'Order',
      filterType: 'partial',
      isInSimpleQuery: true,
    },
    {
      varName: 'paymentMethod',
      filterField: 'uuid',
      label: 'Payment Method',
      type: 'string',
      relName: 'paymentMethodFilterRel',
      relType: 'inverse',
      model: 'PaymentMethod',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'shippingMethod',
      filterField: 'uuid',
      label: 'Shipping Method',
      type: 'string',
      relName: 'shippingMethodFilterRel',
      relType: 'inverse',
      model: 'ShippingMethod',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'user',
      filterField: 'uuid',
      label: 'User',
      type: 'string',
      relName: 'userFilterRel',
      relType: 'inverse',
      model: 'User',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
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
      varName: 'productVariant',
      filterField: 'uuid',
      label: 'Product Variant',
      type: 'string',
      relName: 'productVariantFilterRel',
      relType: 'inverse',
      model: 'ProductVariant',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
