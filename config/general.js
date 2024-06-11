const { resolve } = require("path");
const os = require("os");
module.exports = {
  previewServer: {
    location: process.env.ASTRO_SITE_PATH,
    baseUrl: process.env.ASTRO_SITE_PREVIEW_URL,
    scripts: {
      dev: os.platform() === 'win32' ? 'npm.cmd run dev' : 'npm run dev',
      dumpData: os.platform() === 'win32' ? 'npm.cmd run dump:data' : 'npm run dump:data',
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
      slugPattern : '/products/%(slug)s'
    },
    Page: {
      slugPattern : '/page/%(slug)s'
    },
    PageCategory: {
      slugPattern : '/pages/%(slug)s'
    }
  }
}
