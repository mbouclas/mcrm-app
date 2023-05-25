module.exports = {
  items: {
    images: {
      copies: '',
    },
    files: {}
  },
  categories: {},
  import: {
    overwriteImages: false,
    templates: [
      {
        id: 'products',
        name: 'Products',
        default: true,
        fieldMap: [
          {
            importFieldName: "Reference",
            name: "sku",
            required: true
          },
          {
            importFieldName: "variantID",
            name: "variantId",
            required: true,
            type: 'variantId'
          },
          {
            importFieldName: "Name",
            name: "title",
            required: true,
            isSlugFor: "slug"
          },
          {
            importFieldName: "Eng Description",
            name: "description",
            required: true
          },
          {
            importFieldName: "PRICE",
            name: "price",
            required: true,
            type: "price"
          },
          {
            importFieldName: "Image",
            name: "image",
            required: true,
            type: "image"
          },
          {
            importFieldName: "PIECES PER BOX",
            name: "pieces",
            required: false,
            type: "number"
          },
          {
            importFieldName: "Item Height",
            name: "height",
            required: false,
            type: "number"
          },
          {
            importFieldName: "Item Width",
            name: "width",
            required: false,
            type: "number"
          },
          {
            importFieldName: "Item Weight",
            name: "weight",
            required: false,
            type: "number"
          },
          {
            importFieldName: "Item Diameter",
            name: "diameter",
            required: false,
            type: "number"
          },
          {
            importFieldName: "Category",
            name: "categories",
            required: true,
            type: "category"
          },
          {
            importFieldName: "SIZE",
            name: "property.size",
            required: false,
            type: "property"
          },
          {
            importFieldName: "property.color",
            name: "color",
            required: false,
            matchSourceValue: "code",
            matchTargetValue: "name",
            type: "property"
          },
          {
            importFieldName: "property.material",
            name: "material",
            required: false,
            matchSourceValue: "slug",
            matchTargetValue: "slug",
            type: "property",
            slugifyValue: true
          }
        ]
      },
    ]
  }
}
