module.exports = {
  name: 'MCRM',
  storeUrl: process.env.BASE_URL,
  storeLogo: '',
  VAT: 19,
  quickCheckout: true,
  guestCheckout: false,
  orderStatuses: [
    {
      id: 1,
      label: 'started',
    },
    {
      id: 2,
      label: 'processing',
    },
    {
      id: 3,
      label: 'shipped',
    },
    {
      id: 4,
      label: 'completed',
    },
    {
      id: 5,
      label: 'cancelled',
    },
  ],
  users: {
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
    email: {
      from: {
        mail: 'mailer@mcrm.io',
        name: 'Mailer'
      },
      adminEmail: {
        mail: 'mailer@mcrm.io',
        name: 'Mailer'
      },
      order: {
        admin: {
          created: {
            subject: 'New order',
            template: 'emails/notifications/admin/orders/order-created.liquid'
          },
          updated: {
            subject: 'Order updated',
            template: 'emails/notifications/admin/orders/order-updated.liquid'
          },
          cancelled: {
            subject: 'Order cancelled',
            template: 'emails/notifications/admin/orders/order-cancelled.liquid'
          }
        },
        customer: {
          created: {
            subject: 'New order',
            template: 'emails/notifications/customer/orders/order-created.liquid'
          },
          updated: {
            subject: 'Order updated',
            template: 'emails/notifications/customer/orders/order-updated.liquid'
          },
          cancelled: {
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
}
