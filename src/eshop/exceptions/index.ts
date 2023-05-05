import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class PaymentMehodExists extends BaseHttpException {
  constructor() {
    super(errors.PAYMENT_METHOD_EXISTS);
  }
}
