const { resolve } = require("path");

module.exports = {
  previewServer: {
    location: process.env.ASTRO_SITE_PATH,
    baseUrl: process.env.ASTRO_SITE_PREVIEW_URL,
    scripts: {
      dev: 'npm.cmd run dev',
      dumpData: 'npm.cmd run dump:data',
    }
  },
  backups: {
    objectStorage: {
      uploadOnSuccess: true,
      bucketName: 'backups',
    }
  },
  updates: {
    updatesDir: resolve(process.cwd(), 'updates'),
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
