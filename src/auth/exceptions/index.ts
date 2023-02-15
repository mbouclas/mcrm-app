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

export class InvalidConfirmToken extends BaseHttpException {
  constructor() {
    super(errors.INVALID_CONFIRM_TOKEN);
  }
}

export class UserDoesNotExist extends BaseHttpException {
  constructor() {
    super(errors.USER_DOES_NOT_EXIST);
  }
}

export class InvalidForgotPasswordToken extends BaseHttpException {
  constructor() {
    super(errors.INVALID_FORGOT_PASSWORD_TOKEN);
  }
}
