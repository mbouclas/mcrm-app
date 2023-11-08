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
        id: 'ImportProductsWithVariantsTemplate',// this must match the template provider name
        fieldMap: []
      },
    ]
  }
}
