import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class CustomerPaymentMehodExists extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_EXISTS);
  }
}

export class CustomerPaymentMehodFailedCreate extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_FAILED_CREATE);
  }
}

export class CustomerNotFound extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_NOT_FOUND);
  }
}

export class ProviderPaymentMethodNotFound extends BaseHttpException {
  constructor() {
    super(errors.PROVIDER_PAYMENT_METHOD_NOT_FOUND);
  }
}

export class CustomerPaymentMethodNotFound extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_NOT_FOUND);
  }
}

export class CustomerPaymentMethodFailedDelete extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_FAILED_DELETE);
  }
}

export class OrderNotFound extends BaseHttpException {
  constructor() {
    super(errors.ORDER_NOT_FOUND);
  }
}

export class OrderFailed extends BaseHttpException {
  constructor() {
    super(errors.ORDER_FAILED);
  }
}

export class BillingAddressFailed extends BaseHttpException {
  constructor() {
    super(errors.BILLING_ADDRESS_FAILED);
  }
}

export class BillingAddressNotFound extends BaseHttpException {
  constructor() {
    super(errors.BILLING_ADDRESS_NOT_FOUND);
  }
}

export class ShippingAddressFailed extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_ADDRESS_FAILED);
  }
}

export class ShippingAddressNotFound extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_ADDRESS_NOT_FOUND);
  }
}

export class PaymentMethodNotFound extends BaseHttpException {
  constructor() {
    super(errors.PAYMENT_METHOD_NOT_FOUND);
  }
}

export class ShippingMethodNotFound extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_METHOD_NOT_FOUND);
  }
}

export class PaymentMethodFailedTransaction extends BaseHttpException {
  constructor() {
    super(errors.PAYMENT_METHOD_FAILED_TRANSACTION);
  }
}

export class ShippingMethodFaildTransaction extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_METHOD_FAILED_TRANSACTION);
  }
}
