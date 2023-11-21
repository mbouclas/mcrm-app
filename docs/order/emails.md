# Email Views

They reside in the `/views` directory. Since we're using Maizzle as view renderer, that root of the path given should be the root of `/views`

*e.g.* `emails/notifications/admin/orders/order-created.liquid`

## Store emails

You can override the default views folder via the `store.notifications.email.viewsDir` property in `client-configs`. It must be a valid path, so use `resolve` like `viewsDir: resolve(process.cwd(), 'client-code', 'views'),`

## General emails

You can override the default views folder via the `mail.viewsDir` property in `client-configs`. It must be a valid path, so use `resolve` like `viewsDir: resolve(process.cwd(), 'client-code', 'views'),`