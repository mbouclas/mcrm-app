const { resolve } = require("path");
module.exports = {
  name: 'MCRM',
  storeUrl: process.env.BASE_URL,
  adminUrl: `${process.env.BASE_APP_URL}`,
  storeLogo: '',
  VAT: 19,
  quickCheckout: true,
  guestCheckout: false,
  orderStatuses: [
    {
      id: 1,
      label: 'Started',
      value: 'started'
    },
    {
      id: 2,
      label: 'Processing',
      value: 'processing',
    },
    {
      id: 3,
      label: 'Shipped',
      value: 'shipped',
    },
    {
      id: 4,
      label: 'Completed',
      value: 'completed',
    },
    {
      id: 5,
      label: 'Cancelled',
      value: 'cancelled',
    },
  ],
  users: {
    newUserDefaultRole: {
      name: 'customer',
      displayName: 'Customer',
      description: 'Customer role',
      level: 1,
    },
    registerGuests: false,
    hooks: {
      beforeUserValidation: '',
      afterUserValidation: '',
      beforeCreate: '',
      afterCreate: '',
      beforeUpdate: '',
      afterUpdate: '',
      beforeDelete: '',
      afterDelete: '',
    }
  },
  order: {
    hooks: {
      beforeOrderValidation: '',
      afterOrderValidation: '',
      beforeCreate: '',
      afterCreate: '',
      beforeUpdate: '',
      afterUpdate: '',
      beforeDelete: '',
      afterDelete: '',
    }
  },
  notifications: {
    workers: {
      customer: null,
      admin: null,
    },
    email: {
      from: {
        mail: 'mailer@mcrm.io',
        name: 'Mailer'
      },
      adminEmail: {
        mail: 'mailer@mcrm.io',
        name: 'Mailer'
      },
      cc: [],
      viewsDir: undefined,
      order: {
        admin: {
          '1': {
            subject: 'New order',
            template: 'emails/notifications/admin/orders/order-created.liquid'
          },
        },
        customer: {
          1: {
            subject: 'New order',
            template: 'emails/notifications/customer/orders/order-created.liquid'
          },
          2: {
            subject: 'Order updated',
            template: 'emails/notifications/customer/orders/order-updated.liquid'
          },
          5: {
            subject: 'Order cancelled',
            template: 'emails/notifications/customer/orders/order-cancelled.liquid'
          }
        },
      },
      user: {
        created: {
          customer: {
            subject: 'Welcome to %(storeName)s',
            template: 'emails/notifications/customer/account-created.liquid'
          },
          admin: {
            subject: 'New user registration',
            template: 'emails/notifications/admin/customers/user-created.liquid'
          }
        }
      }
    }
  },
  invoices: {
    logo: '',
    dateFormat: 'DD.MM.YYYY',
    address: {
      street: 'MCRM',
      city: 'MCRM',
      zip: 'MCRM',
      country: 'MCRM',
    },
    serviceOptions: {
      saveToObjectStorage: true,
      bucketName: 'invoices',
    },
    pdf: {
      driver: 'PdfCreator',
      templateFile: resolve(process.cwd(), 'views', 'pdf', 'invoice.html'),
      driverOptions: {
        outputDirectory: resolve(process.cwd(), 'upload'),
        format: "A4",
        orientation: "portrait",
        border: "10mm",
        headerTemplate: null,
        header: {
          height: "45mm",
          contents: `<div style="text-align: center;">Author: Shyam Hajare</div>`
        },
        footerTemplate: null,
        footer: {
          height: "28mm",
          contents: {
            // first: 'Cover page',
            // 2: 'Second page', // Any page number is working. 1-based index
            default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
            // last: 'Last Page'
          }
        },
      }
    }
  },
  sync: {
    elasticSearch: {
      converter: null, //Override default converter with a custom one. Must be in the form of a class. Here we add the container ID. Called in SyncEsService
      searchService: null, // Override default search service with a custom one. Must be in the form of a class. Here we add the container ID. Called in the SearchController
      similarProductsService: null, // Override default similar products service with a custom one. Must be in the form of a class. Here we add the container ID. Called in the SearchController
    }
  }
}
