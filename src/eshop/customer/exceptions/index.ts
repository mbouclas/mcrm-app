import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class NotFound extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}

export class FailedUpdate extends BaseHttpException {
  constructor() {
    super(errors.FAILED_UPDATE);
  }
}
