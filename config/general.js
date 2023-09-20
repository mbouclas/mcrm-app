module.exports = {
  backups: {
    objectStorage: {
      uploadOnSuccess: true,
      bucketName: 'backups',
    }
  },
  modelSettings: {
    Product: {
      slugPattern : '/product/%(uuid)s/%(slug)s'
    },
    ProductCategory: {
      slugPattern : '/category/%(slug)s'
    },
    Page: {
      slugPattern : '/page/%(slug)s'
    },
    PageCategory: {
      slugPattern : '/pages/%(slug)s'
    }
  }
}
