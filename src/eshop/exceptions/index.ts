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
    super(errors.CUSTOMER_PAYMENT_METHOD_FAILED_CREATE);
  }
}
