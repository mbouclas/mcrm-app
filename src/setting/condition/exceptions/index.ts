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

export class FailedCreate extends BaseHttpException {
  constructor() {
    super(errors.FAILED_CREATE);
  }
}

export class FailedDelete extends BaseHttpException {
  constructor() {
    super(errors.FAILED_DELETE);
  }
}
