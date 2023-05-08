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

export class CustomerDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_DOES_NOT_EXIST);
  }
}

export class ProviderPaymentMethodDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.PROVIDER_PAYMENT_METHOD_DOES_NOT_EXIST);
  }
}

export class CustomerPaymentMethodDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_DOES_NOT_EXIST);
  }
}

export class CustomerPaymentMethodFailedDelete extends BaseHttpException {
  constructor() {
    super(errors.CUSTOMER_PAYMENT_METHOD_FAILED_DELETE);
  }
}

export class OrderDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.ORDER_DOES_NOT_EXIST);
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

export class BillingAddressDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.BILLING_ADDRESS_DOES_NOT_EXIST);
  }
}

export class ShippingAddressFailed extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_ADDRESS_FAILED);
  }
}

export class ShippingAddressDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.SHIPPING_ADDRESS_DOES_NOT_EXIST);
  }
}
