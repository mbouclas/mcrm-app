import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class InvalidCredentials extends BaseHttpException {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
  }
}

export class UserExists extends BaseHttpException {
  constructor() {
    super(errors.USER_EXISTS);
  }
}
