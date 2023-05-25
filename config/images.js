module.exports = {
  provider: 'CloudinaryProvider',
  cloudinary: {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    folder: process.env.CLOUDINARY_FOLDER || '',
  },
  copies: [

  ],
  import: {
    templates: [
      {
        id: 'default',
        name: 'default',
        default: true,
        fieldMap: [
          {
            importFieldName: 'variantID',
            name: 'variantId',
            type: 'variantId',
            required: false,
          },
          {
            importFieldName: 'productID',
            name: 'productId',
            type: 'productId',
            required: false,
          },
          {
            importFieldName: 'image',
            name: 'image',
            type: 'image',
            required: true,
          },
        ]
      }
    ]
  }
}
