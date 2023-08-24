import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class NotFound extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}

export class FailedUpdate extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}

export class FailedCreate extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}

export class FailedDelete extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}
